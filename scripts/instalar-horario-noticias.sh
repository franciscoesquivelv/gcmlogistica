#!/bin/bash
# ============================================================================
# GCM Logística - Instalar/cambiar el horario del resumen semanal de noticias
# ============================================================================
# Uso:
#   ./instalar-horario-noticias.sh [DIA_SEMANA] [HORA] [MINUTO]
#
#   DIA_SEMANA: 0 o 7 = domingo, 1 = lunes, 2 = martes, ... 6 = sabado
#   HORA:       0-23 (hora local de esta Mac)
#   MINUTO:     0-59
#
# Por defecto (sin argumentos): lunes 19:00 (7pm).
#
# Ejemplos:
#   ./instalar-horario-noticias.sh            # lunes 7pm (default actual)
#   ./instalar-horario-noticias.sh 5 23 0      # viernes 11pm
#   ./instalar-horario-noticias.sh 1 19 0      # lunes 7pm
#
# Este script se puede correr las veces que haga falta: siempre recarga el
# LaunchAgent con el horario nuevo.
# ============================================================================

set -euo pipefail

WEEKDAY="${1:-1}"   # default: 1 = lunes
HOUR="${2:-19}"     # default: 19 = 7pm
MINUTE="${3:-0}"    # default: 0

LABEL="com.gcm.noticias-semanal"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
# IMPORTANTE: launchd invoca el stub en Application Support, NUNCA un script
# dentro de ~/Documents directamente (macOS bloquea el acceso a Documents
# para procesos lanzados en segundo plano; protección de privacidad TCC).
# El stub clona/actualiza el repo fuera de Documents y desde ahí ejecuta la
# lógica real (versionada en este mismo scripts/noticias-semanal.sh).
WRAPPER_SCRIPT="$HOME/Library/Application Support/gcm-noticias-semanal/launch-stub.sh"
LOG_FILE="$HOME/Library/Logs/gcm-noticias-semanal.log"
LOG_ERR_FILE="$HOME/Library/Logs/gcm-noticias-semanal.err.log"

if [ ! -x "$WRAPPER_SCRIPT" ]; then
  echo "ERROR: no se encontro o no es ejecutable: $WRAPPER_SCRIPT" >&2
  echo "(el stub debe existir en Application Support antes de instalar el horario)" >&2
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$(dirname "$LOG_FILE")"

cat > "$PLIST_PATH" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${WRAPPER_SCRIPT}</string>
  </array>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key>
    <integer>${WEEKDAY}</integer>
    <key>Hour</key>
    <integer>${HOUR}</integer>
    <key>Minute</key>
    <integer>${MINUTE}</integer>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>StandardOutPath</key>
  <string>${LOG_FILE}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_ERR_FILE}</string>

  <key>ProcessType</key>
  <string>Background</string>
</dict>
</plist>
PLIST_EOF

echo "Plist escrito en: $PLIST_PATH"

# Descargar version anterior si estaba cargada, y cargar la nueva.
launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl enable "gui/$(id -u)/${LABEL}"

DIAS=(domingo lunes martes miercoles jueves viernes sabado)
DIA_IDX=$WEEKDAY
if [ "$DIA_IDX" -eq 7 ]; then DIA_IDX=0; fi
DIA_NOMBRE="${DIAS[$DIA_IDX]}"

printf -v HORA_FMT "%02d:%02d" "$HOUR" "$MINUTE"

echo ""
echo "Listo. El resumen semanal correra cada ${DIA_NOMBRE} a las ${HORA_FMT} (hora de esta Mac),"
echo "siempre que la Mac este encendida en ese momento. RunAtLoad tambien esta activo:"
echo "si la Mac estuvo apagada o dormida a esa hora, corre apenas se prenda o inicies sesion"
echo "(el script internamente decide si hace falta o si ya se proceso esa semana)."
echo ""
echo "Log:        $LOG_FILE"
echo "Log errores: $LOG_ERR_FILE"
echo ""
echo "Para correrlo ahora mismo de prueba: launchctl kickstart -k gui/\$(id -u)/${LABEL}"
echo "Para cambiar el horario despues: vuelve a correr este script con otros argumentos."
