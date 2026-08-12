#!/bin/bash
# ============================================================================
# GCM Logistica - Verificacion obligatoria antes de publicar
# ============================================================================
# Bloquea commits que violen las reglas absolutas del proyecto.
#
# Se instala como hook de pre-commit con:
#   ./scripts/instalar-guard.sh
#
# Y lo invoca tambien la automatizacion semanal antes de su push.
#
# Uso manual:
#   ./scripts/verificar-antes-de-publicar.sh            # revisa el arbol completo
#   ./scripts/verificar-antes-de-publicar.sh --staged   # solo lo que esta en stage
#
# Sale con codigo 1 si encuentra una violacion. Codigo 0 si todo pasa.
#
# NOTA sobre los patrones codificados en base64 mas abajo: describen la
# estructura interna del negocio y no deben aparecer en claro en un
# repositorio publico, ni siquiera dentro de este verificador. Se decodifican
# en memoria al ejecutar.
# ============================================================================

set -uo pipefail

cd "$(git rev-parse --show-toplevel)" || exit 1

MODO="${1:-}"
FALLAS=0

rojo()  { printf "\033[31m%s\033[0m\n" "$1"; }
verde() { printf "\033[32m%s\033[0m\n" "$1"; }

# Que archivos revisar
if [ "$MODO" = "--staged" ]; then
  ARCHIVOS=$(git diff --cached --name-only --diff-filter=ACM)
else
  ARCHIVOS=$(git ls-files)
fi

# TODOS los archivos de texto del repositorio. El chequeo 1 (estructura del
# negocio) se aplica aqui sin excepciones: fue exactamente por un archivo de
# instrucciones, no por una pagina, que esto se filtro una vez.
REVISABLES=$(echo "$ARCHIVOS" | grep -E '\.(html|css|js|xml|txt|md|json|toml|sh)$' || true)

# Archivos que DEFINEN las reglas y por lo tanto citan las frases prohibidas
# como ejemplo. Se excluyen de los chequeos de redaccion, nunca del chequeo 1.
NORMATIVOS='^(CLAUDE\.md|README\.md|seo/|scripts/playbook-articulo-semanal\.md|scripts/verificar-antes-de-publicar\.sh)'

# Lo que de verdad llega al visitante del sitio.
DEL_SITIO=$(echo "$REVISABLES" | grep -E '\.(html|css|js|xml)$' | grep -vE "$NORMATIVOS" || true)

if [ -z "$REVISABLES" ]; then
  verde "Guard: no hay archivos revisables en este cambio."
  exit 0
fi

reportar() {
  # $1 = descripcion, $2 = resultado del grep
  if [ -n "$2" ]; then
    rojo "FALLA: $1"
    echo "$2" | sed 's/^/    /'
    echo ""
    FALLAS=$((FALLAS + 1))
  fi
}

# ── 1. Descripcion de la estructura operativa del negocio ─────────────────
# Estos terminos no deben quedar escritos en ningun archivo del repositorio.
T_A=$(echo 'YXNzZXQtbGlnaHQ=' | base64 -d)
T_B=$(echo 'c3ViY29udHJhdA==' | base64 -d)

HIT=$(echo "$REVISABLES" | xargs grep -l -i -e "$T_A" -e "$T_B" 2>/dev/null || true)
reportar "hay archivos que describen la estructura operativa interna del negocio. Eso no se escribe en el repositorio, ni siquiera en comentarios o en instrucciones para agentes. Expresa la regla sin declarar el motivo." "$HIT"

# A partir de aqui se revisa lo que llega al visitante. Si no hay nada del
# sitio en este cambio, estos chequeos no aplican.
if [ -n "$DEL_SITIO" ]; then

# ── 2. Frases que atribuyen medios materiales a GCM ───────────────────────
PATRON_ACTIVOS='nuestras unidades|nuestra flota|nuestros conductores|nuestros camiones|nuestros cabezales|flota propia|capacidad propia|contamos con [0-9]+ (furgones|unidades|camiones)|unidades propias'
HIT=$(echo "$DEL_SITIO" | xargs grep -n -i -E "$PATRON_ACTIVOS" 2>/dev/null || true)
reportar "hay frases que describen a GCM por medios materiales. GCM se describe por lo que coordina y por su responsabilidad ante el cliente. Verbos seguros: coordina, gestiona, verifica, da seguimiento, responde por." "$HIT"

# ── 3. Negacion de lo anterior (tambien revela por contraste) ─────────────
PATRON_NEGACION='sin (flota|unidades|camiones|activos) propi|no (tenemos|contamos con) (flota|unidades|camiones)|sin call centers ni terceros|sin terceros'
HIT=$(echo "$DEL_SITIO" | xargs grep -n -i -E "$PATRON_NEGACION" 2>/dev/null || true)
reportar "hay negaciones sobre los medios de GCM. Negar tambien informa. No se afirma ni se niega: se describe la coordinacion." "$HIT"

# ── 4. Em-dash, literal y escapado ────────────────────────────────────────
HIT=$(echo "$DEL_SITIO" | xargs grep -n -e '—' -e '&mdash;' 2>/dev/null || true)
reportar "hay em-dash. Regla absoluta del proyecto: usa punto, coma, dos puntos o parentesis." "$HIT"

HIT=$(echo "$DEL_SITIO" | xargs grep -n '\\u2014' 2>/dev/null || true)
reportar "hay em-dash escapado en unicode (dentro de JSON-LD, tipicamente)." "$HIT"

# ── 5. Promesas de tiempo de respuesta o servicio ─────────────────────────
PATRON_TIEMPO='en menos de [0-9]+ *(horas|hrs|dias)|respondemos en [0-9]|respuesta en [0-9]+ *(horas|hrs)|garantizamos (la )?entrega'
HIT=$(echo "$DEL_SITIO" | grep -E '\.(html|xml)$' | xargs grep -n -i -E "$PATRON_TIEMPO" 2>/dev/null || true)
reportar "hay promesas de tiempo de respuesta o de servicio. El proyecto no promete plazos en copy publico." "$HIT"

fi

# ── 6. Archivos internos que quedarian servidos en el sitio ───────────────
# Netlify publica la raiz del repo. Todo archivo versionado es una URL viva
# salvo que netlify.toml lo bloquee explicitamente.
INTERNOS=$(git ls-files | grep -E '^(scripts|seo)/|^CLAUDE\.md$|^README\.md$|^netlify\.toml$|^\.claude/' || true)
NO_BLOQUEADOS=""
for f in $INTERNOS; do
  raiz=$(echo "$f" | cut -d/ -f1)
  if ! grep -q "from = \"/$raiz" netlify.toml 2>/dev/null && ! grep -q "from = \"/$f\"" netlify.toml 2>/dev/null; then
    NO_BLOQUEADOS="$NO_BLOQUEADOS$f\n"
  fi
done
if [ -n "$NO_BLOQUEADOS" ]; then
  rojo "FALLA: hay archivos internos versionados que se servirian en el sitio publico."
  printf "%b" "$NO_BLOQUEADOS" | sed 's/^/    /'
  echo "    Agrega un bloqueo 404 en netlify.toml para cada uno."
  echo ""
  FALLAS=$((FALLAS + 1))
fi

# ── Resultado ─────────────────────────────────────────────────────────────
echo ""
if [ "$FALLAS" -gt 0 ]; then
  rojo "Guard: $FALLAS regla(s) violada(s). Commit bloqueado."
  echo "Corrige lo de arriba y volve a intentar."
  echo "Para saltarlo de forma consciente y excepcional: git commit --no-verify"
  exit 1
fi

verde "Guard: todas las reglas pasan."
exit 0
