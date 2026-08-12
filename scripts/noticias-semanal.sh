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
LOCK_FILE="$STATE_DIR/run.lock"

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

# ── Bloqueo: nunca dos instancias a la vez sobre el mismo clon ─────────────
# La noche del 3-4 de agosto de 2026 una corrida real (disparada por
# RunAtLoad) y una prueba manual DRY_RUN se pisaron sobre el mismo clon:
# el git reset/clean de la prueba borro archivos que la corrida real
# todavia no habia commiteado. Salio bien de milagro. Este lock evita que
# vuelva a pasar.
#
# Cuando launch-stub.sh invoca este script lo hace con `exec`, que preserva
# el PID: el lock que ya escribio el stub tiene el mismo $$ que este
# proceso, asi que encontrarnos con nuestro propio PID en el lock es
# normal, no un conflicto. Solo abortamos si el PID del lock es DE OTRO
# proceso vivo.
if [ -f "$LOCK_FILE" ]; then
  lock_pid=$(cat "$LOCK_FILE" 2>/dev/null | tr -d '[:space:]')
  if [ "$lock_pid" = "$$" ]; then
    : # el lock ya es nuestro (heredado del stub via exec), seguimos
  elif [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
    log "Ya hay otra corrida en curso (PID $lock_pid). Se aborta esta invocacion para no interferir."
    exit 0
  else
    log "Lock huerfano encontrado (PID $lock_pid ya no existe). Se libera y se continua."
  fi
fi
echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

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

# ── Comprobar que hay red antes de gastar nada ─────────────────────────────
# El lunes 10 de agosto de 2026 el agente disparo a las 19:09 sin conexion:
# el git fetch fallo por DNS, y aun asi el script siguio adelante e invoco
# claude -p, que estuvo 27 minutos intentando alcanzar la API antes de
# rendirse. Sin red no hay nada que hacer, y conviene salir rapido para que
# el reintento posterior encuentre el terreno limpio.
if ! curl -sf --max-time 15 -o /dev/null https://api.anthropic.com/v1/models \
   && ! curl -sf --max-time 15 -o /dev/null https://github.com; then
  log "Sin conexion a internet. Se sale sin marcar la semana; se reintentara en la proxima corrida."
  exit 0
fi

# ── Dejar el repo limpio y actualizado con origin/main ─────────────────────
cd "$REPO_DIR" || { log "ERROR: no se pudo entrar a $REPO_DIR"; exit 1; }

git fetch origin main >> "$LOG_FILE" 2>&1
git checkout main >> "$LOG_FILE" 2>&1
git reset --hard origin/main >> "$LOG_FILE" 2>&1
git clean -fd >> "$LOG_FILE" 2>&1

# Los hooks de git no se clonan, asi que este clon dedicado no los tiene.
# Se reinstalan en cada corrida para que el guard bloquee cualquier commit
# de la automatizacion que viole las reglas del proyecto. Es idempotente.
if [ -x "$REPO_DIR/scripts/instalar-guard.sh" ]; then
  "$REPO_DIR/scripts/instalar-guard.sh" >> "$LOG_FILE" 2>&1 \
    && log "Guard de pre-commit instalado en el clon dedicado." \
    || log "AVISO: no se pudo instalar el guard de pre-commit."
fi

# ── Armar el prompt final sustituyendo la fecha en la plantilla ────────────
sed \
  -e "s/__TARGET_DATE__/$TARGET_DATE/g" \
  -e "s/__TARGET_DATE_LARGA__/$TARGET_DATE_LARGA/g" \
  "$PROMPT_TEMPLATE" > "$TMP_PROMPT"

# Modo de prueba: DRY_RUN=1 ./noticias-semanal.sh corre todo (calculo de
# fecha, idempotencia, git sync, armado del prompt) SIN invocar claude -p
# ni gastar presupuesto ni tocar el state file. Util para validar el
# mecanismo (por ejemplo el stub de launchd) sin publicar nada de verdad.
if [ "${DRY_RUN:-0}" = "1" ]; then
  log "DRY_RUN=1: se omite la invocacion real de claude -p."
  log "Prompt final armado correctamente en $TMP_PROMPT ($(wc -l < "$TMP_PROMPT") lineas)."
  log "=== Fin de la corrida (dry run, nada publicado, state file no tocado) ==="
  exit 0
fi

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
