#!/bin/bash
# ============================================================================
# GCM Logistica - Instalar el guard como hook de pre-commit
# ============================================================================
# Los hooks de git viven en .git/hooks/, que no se versiona. O sea que cada
# copia del repositorio (y cada maquina) necesita correr esto una vez.
#
#   ./scripts/instalar-guard.sh
#
# Despues de instalarlo, cada commit corre la verificacion sobre lo que este
# en stage y se bloquea si viola una regla del proyecto.
# ============================================================================

set -euo pipefail

RAIZ="$(git rev-parse --show-toplevel)"
HOOK="$RAIZ/.git/hooks/pre-commit"

cat > "$HOOK" <<'HOOK_EOF'
#!/bin/bash
# Hook instalado por scripts/instalar-guard.sh
# La logica vive en scripts/verificar-antes-de-publicar.sh (versionado).
RAIZ="$(git rev-parse --show-toplevel)"
GUARD="$RAIZ/scripts/verificar-antes-de-publicar.sh"

if [ ! -x "$GUARD" ]; then
  echo "Aviso: no se encontro $GUARD. Commit permitido sin verificacion."
  exit 0
fi

exec "$GUARD" --staged
HOOK_EOF

chmod +x "$HOOK"

echo "Hook de pre-commit instalado en: $HOOK"
echo ""
echo "Desde ahora, cada commit verifica:"
echo "  1. Que ningun archivo describa la estructura operativa interna del negocio."
echo "  2. Que el sitio no atribuya medios materiales a GCM, ni los niegue."
echo "  3. Que no haya em-dash, literal ni escapado."
echo "  4. Que no haya promesas de tiempo de respuesta o servicio."
echo "  5. Que ningun archivo interno versionado quede servido en el sitio publico."
echo ""
echo "Probalo ahora sin commitear nada:  ./scripts/verificar-antes-de-publicar.sh"
