#!/bin/bash
# ============================================================================
# GCM Logística - Resumen semanal de noticias del corredor
# ============================================================================
# Corre disparado por el LaunchAgent com.gcm.noticias-semanal (ver
# scripts/instalar-horario-noticias.sh para el horario configurado).
#
# Qué hace:
#   1. Calcula el día objetivo más reciente (TARGET_WEEKDAY) hasta hoy.
#   2. Si ya se procesó esa fecha (ver STATE_FILE), no hace nada.
#   3. Si no, deja la copia local del repo en el estado de origin/main,
#      corre `claude -p` con el proceso editorial completo (investigación
#      rigurosa de fuentes, redacción en voz humana, construcción de la
#      página, autoverificación, commit y push), y registra el resultado.
#
# IMPORTANTE: este script NUNCA lo ejecuta launchd directamente desde esta
# copia versionada en Documents. macOS bloquea el acceso a Documents para
# procesos lanzados en segundo plano (proteccion de privacidad TCC), asi que
# launchd invoca un stub en ~/Library/Application Support/gcm-noticias-semanal/
# (fuera de esa proteccion), que clona/actualiza el repo ahi y ejecuta ESTA
# MISMA copia desde ese clon. Por eso REPO_DIR se calcula dinamicamente
# relativo a la ubicacion real del script en cada corrida, nunca hardcodeado.
#
# Cada corrida hace `git reset --hard origin/main` sobre el clon donde se
# esta ejecutando: no dejes cambios sin commitear en ese clon, se perderan.
# El repo de trabajo normal en Documents no se toca.
#
# El prompt editorial vive por separado en prompt-noticias-semanal.txt
# (mismo directorio, versionado). Editalo ahi si queres ajustar el proceso;
# este script solo sustituye la fecha y lo invoca.
# ============================================================================

set -uo pipefail

# ── Configuración ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CLAUDE_BIN="/Users/franciscoesquivel/.local/bin/claude"
PROMPT_TEMPLATE="$SCRIPT_DIR/prompt-noticias-semanal.txt"
STATE_DIR="$HOME/Library/Application Support/gcm-noticias-semanal"
STATE_FILE="$STATE_DIR/last-run.txt"
LOG_FILE="$HOME/Library/Logs/gcm-noticias-semanal.log"
TMP_PROMPT="$STATE_DIR/prompt-actual.txt"

# Día objetivo de la edición semanal: 1=lunes ... 7=domingo (mismo criterio
# que `date +%u`). Cambialo aquí si cambia el día de la semana; el horario
# del LaunchAgent se cambia por separado con instalar-horario-noticias.sh.
TARGET_WEEKDAY=1   # lunes

MAX_BUDGET_USD=8

mkdir -p "$STATE_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# ── Calcular la fecha objetivo más reciente (hoy o hacia atrás) ────────────
today_dow=$(date +%u)   # 1..7
if [ "$today_dow" -ge "$TARGET_WEEKDAY" ]; then
  days_back=$((today_dow - TARGET_WEEKDAY))
else
  days_back=$((today_dow + 7 - TARGET_WEEKDAY))
fi
TARGET_DATE=$(date -v-"${days_back}"d +%Y-%m-%d)
TARGET_DATE_LARGA=$(LC_TIME=es_ES.UTF-8 date -v-"${days_back}"d "+%A %d de %B de %Y")

log "=== Disparo del LaunchAgent. Fecha objetivo calculada: $TARGET_DATE ==="

# ── Idempotencia: ¿ya se procesó esta fecha objetivo? ──────────────────────
if [ -f "$STATE_FILE" ]; then
  last_done=$(cat "$STATE_FILE" 2>/dev/null | tr -d '[:space:]')
  if [ "$last_done" = "$TARGET_DATE" ]; then
    log "Ya se proceso $TARGET_DATE anteriormente. No se hace nada."
    exit 0
  fi
fi

if [ ! -x "$CLAUDE_BIN" ]; then
  log "ERROR: no se encontro el binario de claude en $CLAUDE_BIN"
  exit 1
fi

if [ ! -f "$PROMPT_TEMPLATE" ]; then
  log "ERROR: no se encontro la plantilla de prompt en $PROMPT_TEMPLATE"
  exit 1
fi

# ── Dejar el repo limpio y actualizado con origin/main ─────────────────────
cd "$REPO_DIR" || { log "ERROR: no se pudo entrar a $REPO_DIR"; exit 1; }

git fetch origin main >> "$LOG_FILE" 2>&1
git checkout main >> "$LOG_FILE" 2>&1
git reset --hard origin/main >> "$LOG_FILE" 2>&1
git clean -fd >> "$LOG_FILE" 2>&1

# ── Armar el prompt final sustituyendo la fecha en la plantilla ────────────
sed \
  -e "s/__TARGET_DATE__/$TARGET_DATE/g" \
  -e "s/__TARGET_DATE_LARGA__/$TARGET_DATE_LARGA/g" \
  "$PROMPT_TEMPLATE" > "$TMP_PROMPT"

log "Invocando claude -p (esto puede tardar varios minutos)..."

OUTPUT=$(caffeinate -i -- "$CLAUDE_BIN" -p \
  --dangerously-skip-permissions \
  --max-budget-usd "$MAX_BUDGET_USD" \
  --output-format text < "$TMP_PROMPT" 2>&1)
EXIT_CODE=$?

echo "$OUTPUT" >> "$LOG_FILE"
log "claude -p termino con exit code $EXIT_CODE"

RESULT_LINE=$(echo "$OUTPUT" | grep -oE 'RESULTADO: (PUBLICADO|SIN_NOTICIA|ERROR)' | tail -1)

if [ "$EXIT_CODE" -eq 0 ] && { [ "$RESULT_LINE" = "RESULTADO: PUBLICADO" ] || [ "$RESULT_LINE" = "RESULTADO: SIN_NOTICIA" ]; }; then
  echo "$TARGET_DATE" > "$STATE_FILE"
  log "Semana $TARGET_DATE marcada como procesada ($RESULT_LINE)."
else
  log "No se marco $TARGET_DATE como procesada (exit=$EXIT_CODE, resultado='$RESULT_LINE'). Se reintentara en la proxima corrida."
fi

rm -f "$TMP_PROMPT"
log "=== Fin de la corrida ==="
