---
name: articulo-semanal
description: Investiga, verifica, escribe y arma la edicion semanal de noticias del corredor para el blog de GCM Logistica. Se invoca a pedido del dueno, con frases como "haz el articulo de esta semana", "arma la edicion semanal", "el articulo de noticias", "resumen semanal del corredor". No se dispara solo.
---

# Edicion semanal de noticias del corredor

Antes de hacer nada, leer el manual completo:

**`scripts/playbook-articulo-semanal.md`**

Ahi esta el proceso entero: la barra de verificacion de fuentes, la regla de
corroboracion, la confirmacion obligatoria de Vera, la construccion de la pagina,
el mantenimiento del hub y del sitemap, y la verificacion previa a publicar.

Seguirlo tal cual. Las tres cosas que no se negocian:

1. **La barra de fuentes de la Fase 1.** Cada noticia necesita dos fuentes
   independientes aceptables, o una fuente institucional primaria. Lo que no la pasa
   se descarta. Si no pasa ninguna, la semana queda en blanco y se le avisa al dueno:
   ese es el resultado preferido frente a publicar algo dudoso.

2. **La confirmacion de Vera de la Fase 4.** Con un sub-agente real invocado con la
   herramienta Agent, no un autochequeo. El dueno fue explicito en esto.

3. **El verificador de la Fase 7.** `./scripts/verificar-antes-de-publicar.sh
   --staged` es la autoridad. Si falla, se corrige el texto del articulo, nunca el
   verificador.

Salvo que el dueno diga "publicalo directo", mostrarle el resultado antes de hacer
push.

## Contexto util

- La fecha editorial por defecto es el lunes mas reciente, incluido hoy si hoy es lunes.
- Este proceso corria solo con un LaunchAgent hasta el 12 de agosto de 2026. Se retiro
  a pedido del dueno: ahora es a pedido, y el manual es lo que quedo.
