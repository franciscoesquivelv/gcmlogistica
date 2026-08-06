# GCM Logística — reglas del proyecto

> Este repositorio es **público** y su raíz es el directorio que Netlify publica.
> Todo lo que se escriba acá es potencialmente legible por cualquiera, hoy o
> mediante el historial de git. Escribí siempre con ese supuesto.

---

## 1. Cómo se describe a GCM (regla de máxima prioridad)

**GCM se describe siempre por lo que coordina y por su responsabilidad ante el
cliente. Nunca por los medios materiales con que se ejecuta el movimiento, ni
por su estructura operativa interna.**

Verbos seguros: *coordina, gestiona, verifica, da seguimiento, revisa, responde
por, se encarga de, se asegura de.*

**Prohibido escribir**, en cualquier idioma o variante:
`nuestras unidades`, `nuestra flota`, `nuestros conductores`, `nuestros camiones`,
`nuestros cabezales`, `contamos con X furgones`, `capacidad propia`, `flota propia`.

**Prohibido también escribir la negación de cualquiera de esas frases**, o
cualquier afirmación sobre si GCM tiene o no tiene activos, o sobre quién ejecuta
materialmente el traslado. Negar también informa.

Ante la duda sobre si una frase cruza la línea: no la escribas y resolvé con un
verbo de coordinación.

### Dónde aplica

En **todo**, sin excepción: copy visible, meta descriptions, texto dentro de
schema JSON-LD, comentarios de código, mensajes de commit, nombres de archivo,
y cualquier archivo de instrucciones para agentes que viva en este repositorio.

### La regla se enuncia, el motivo no se escribe

Nunca documentes en un archivo *por qué* existe esta regla. La prohibición sola
alcanza para cumplirla. Explicar el motivo es lo que convierte una regla interna
en información publicable.

Esto ya pasó una vez: un archivo de instrucciones para un agente explicaba el
motivo, y quedó servido públicamente en el sitio y en GitHub. La regla se
cumple igual sin esa explicación.

### Verificación automática

`scripts/verificar-antes-de-publicar.sh` bloquea commits que violen esto. Se
instala como hook de pre-commit con `./scripts/instalar-guard.sh` (una vez por
copia del repositorio, porque los hooks no se versionan).

No lo desactives. Si un commit legítimo lo dispara, corregí el texto, no el guard.

---

## 2. Archivos internos no se publican

Netlify sirve la raíz del repositorio: **cada archivo versionado es una URL
viva**, salvo que `netlify.toml` lo bloquee con un redirect 404 explícito.

Al agregar cualquier carpeta o documento interno (scripts, estrategia, notas,
instrucciones para agentes), agregá su bloqueo en `netlify.toml` en el mismo
commit. El guard lo verifica.

---

## 3. Prohibido el em-dash (—)

No puede existir ni un solo carácter em-dash (`—`) ni su entidad `&mdash;` ni su
forma escapada `—` en ningún archivo del sitio (HTML, CSS, JS, XML,
comentarios incluidos). Regla absoluta, sin excepciones.

Si necesitás separar una idea, usá punto, coma, dos puntos o paréntesis.

Ojo con el JSON-LD: ahí el em-dash aparece escapado en unicode y no lo detecta
una búsqueda del carácter literal.

---

## 4. No inventar copy no pedido

Cuando el usuario pida quitar una frase o fragmento específico, quitar
exactamente eso. No reescribir la oración, no rellenar con texto nuevo, no
"mejorar" lo que quedó. Si el corte deja algo raro, preguntar antes de tocar más.

Cuando el usuario dé un texto literal, usarlo tal cual, sin retoques.

---

## 5. Sin tells de IA en el copy

- Nada de negaciones defensivas tipo "somos esto, esto no" (ej: "no excusas, no evasivas").
- Nada de tríadas de adjetivos ("rápido, eficiente, confiable").
- Nada de frases que se asumen o son obvias (ej: "para que llegue como fue preparada").
- Nada de la palabra "soluciones", ni de "¿listo para empezar?".
- Afirmar lo concreto, no negar lo que no se es.
- Ritmo desigual: mezclar frases largas y cortas. Cadenas de frases de tres palabras también delatan IA.
- Voz: español de El Salvador, trato de "usted", B2B.

---

## 6. Sin promesas de tiempo de respuesta

No prometer tiempos de respuesta ni de servicio (ej: "en menos de 24 horas
hábiles", "respuesta en X horas"). GCM no garantiza plazos de este tipo en su
copy público. Aplica a hero, sidebars de ruta, FAQs y schema JSON-LD.

Los tiempos de tránsito por corredor sí se pueden dar, siempre como rangos
orientativos.

---

## 7. Sin precios

Ningún precio, tarifa ni rango de tarifa en el sitio. El costo se conversa por
WhatsApp o por el formulario.

---

## 8. Coherencia entre texto visible y schema

Si una página declara `FAQPage`, el texto del schema debe coincidir **exacto**
con el texto visible en pantalla. Marcar como FAQPage contenido que no está
visible incumple las directrices de Google.

Al editar una FAQ, editá los dos lados en el mismo commit.
