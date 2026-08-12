# Manual: edicion semanal de noticias del corredor

Este manual se ejecuta **a pedido**, cuando el dueno de GCM lo pide (por ejemplo:
"haz el articulo de esta semana"). No hay disparador automatico: la
infraestructura que lo corria sola (LaunchAgent, clon dedicado, script envoltorio)
se retiro el 12 de agosto de 2026.

Lo que sigue es el proceso editorial completo, que es lo que vale. El rigor de la
Fase 1 y la confirmacion de Vera de la Fase 4 no son opcionales.

## Paso 0: contexto

1. Leer `CLAUDE.md` en la raiz: reglas absolutas del proyecto. Innegociables.
2. Leer `blog/incoterms-transporte-terrestre-centroamerica.html` completo como
   plantilla de referencia: estructura HTML, clases CSS, patron de schema JSON-LD,
   TOC, snippet-box, FAQ, CTA, related, footer, boton flotante de WhatsApp.
3. Leer `blog/index.html` y `blog/noticias/index.html` para ver los hubs actuales.
4. **Fecha editorial:** salvo que el dueno diga otra cosa, es el lunes mas reciente
   (incluido hoy si hoy es lunes). Confirmar la fecha con el dueno si hay
   ambiguedad, por ejemplo si pide "el de la semana pasada".

## Como se describe a GCM (regla absoluta, sin excepciones)

GCM se describe SIEMPRE por lo que coordina y por su responsabilidad ante el
cliente. NUNCA por los medios materiales con que se ejecuta el movimiento, ni por
su estructura operativa interna.

Verbos seguros: coordina, gestiona, verifica, da seguimiento, revisa, responde por,
se encarga de, se asegura de.

Prohibido escribir, en cualquier idioma o variante: "nuestras unidades", "nuestra
flota", "nuestros conductores", "nuestros camiones", "nuestros cabezales",
"contamos con X furgones", "capacidad propia", "flota propia". Prohibido tambien
escribir la negacion de cualquiera de esas frases, o cualquier afirmacion sobre si
GCM tiene o no tiene activos, o sobre quien ejecuta materialmente el traslado.

Si una noticia de la semana habla de flota, unidades o capacidad de un tercero (una
naviera, un gobierno, otra empresa), reportala de ese tercero y no la relaciones con
GCM en ningun sentido.

Ante la duda sobre si una frase cruza la linea: no la escribas y resuelve con un
verbo de coordinacion.

## Reglas duras de copy

- CERO caracter em-dash, ni literal ni escapado, en ningun archivo, ni en
  comentarios HTML o CSS. Usar punto, coma, dos puntos o parentesis.
- Sin negaciones defensivas redundantes: afirmar algo y luego negar lo contrario en
  la misma idea (hacemos X, no Y). Afirmar lo concreto.
- Sin promesas de tiempo de respuesta ni de servicio.
- Sin precios ni cifras de tarifas o fletes propias.
- Sin trios de adjetivos, sin la palabra soluciones, sin listo para empezar, sin
  frases que se asumen.
- Voz: espanol de El Salvador, trato de usted, B2B, ritmo desigual (frases largas y
  cortas mezcladas), detalle concreto. Nunca cadenas de frases de tres palabras.

## Fase 1: investigacion y verificacion rigurosa

Es el filtro mas importante. No se salta.

Buscar acontecimientos de los ultimos 7 a 10 dias antes de la fecha editorial, en
politica, economia, finanzas, comercio o temas sociales, que tengan impacto real,
aunque sea ligero o indirecto, sobre la logistica terrestre centroamericana
(corredor El Salvador, Guatemala, Honduras, Nicaragua, Mexico). Califican: cambios
arancelarios, medidas aduaneras, obras o cierres de infraestructura vial o
fronteriza, politica de comercio exterior, tipo de cambio o medidas monetarias que
afecten el costo de operar, tensiones o acuerdos politicos regionales que afecten
fronteras, decisiones de nearshoring o inversion industrial relevantes al corredor,
cambios normativos de SIECA, COMIECO o aduanas.

### Barra de verificacion de fuentes

FUENTES ACEPTABLES (confirmar cada una con WebSearch y WebFetch, nunca citar de
memoria):

- Agencias internacionales: Reuters, AP, AFP, EFE, Bloomberg.
- Prensa establecida de la region: La Prensa Grafica, El Diario de Hoy, El Faro (El
  Salvador); Prensa Libre, La Hora (Guatemala); La Prensa, El Heraldo (Honduras); La
  Prensa, Confidencial (Nicaragua); La Nacion, La Republica (Costa Rica); La Estrella
  de Panama.
- Fuentes institucionales primarias: SIECA, COMIECO, bancos centrales, ministerios de
  economia, hacienda o comercio, aduanas oficiales (DGA, SAT, Aduanas HN), Banco
  Mundial, BID, FMI, OMC.
- Gremios y camaras: AGEXPORT, CATRANSCA, camaras de comercio regionales.

NO ACEPTABLE como unica fuente: blogs sin firma editorial, redes sociales sin
verificar, un solo medio sin corroboracion cuando el hecho deberia estar en mas de un
lugar, contenido de opinion presentado como hecho, cualquier fuente que no se pueda
abrir y confirmar con WebFetch.

### Regla de corroboracion

Cada noticia candidata necesita UNA de estas dos cosas:

- **A.** Confirmacion por al menos DOS fuentes independientes y aceptables, o
- **B.** Una fuente institucional primaria y oficial que hable directamente del hecho.

Si no se cumple ninguna, DESCARTAR. No incluirla por si acaso ni suavizarla con "se
reporta que": simplemente no califica.

### Regla de la semana en blanco

Si ninguna noticia pasa la barra: no crear archivos, no commitear, no publicar.
Avisarle al dueno que esta semana no hubo nada verificable. Es el resultado preferido
frente a publicar algo dudoso, y no es un fallo.

### Calidad sobre cantidad

Si solo una noticia pasa la barra, se publica un articulo con esa sola noticia. No
rellenar con noticias debiles. El dueno prefiere un articulo con una noticia bien
verificada que uno con quince dudosas.

Para cada noticia que pase: que paso (hechos verificados, sin adornar), las fuentes
exactas con URL funcional, y por que es relevante para la logistica centroamericana
en concreto (explicar el mecanismo: como afecta rutas, costos, tiempos, aduanas o el
corredor, no solo describir la noticia).

## Fase 2: estructura y angulo

Solo si al menos una noticia paso el filtro.

- **Titulo:** si es una sola noticia, puede nombrarla directamente. Si son varias,
  formato tipo "Resumen semanal de logistica centroamericana, semana del [rango]".
- **Slug:** `blog/noticias/resumen-semanal-AAAA-MM-DD.html`, con la fecha editorial.
- **Meta description:** 155 caracteres o menos, resumiendo el contenido real, sin
  clickbait.

## Fase 3: redaccion

Un parrafo de intro que responda directo que paso y por que importa en las primeras
40 palabras, autocontenido y extraible por buscadores y por IA. Una seccion por
noticia: que paso, por que le importa a la logistica del corredor, con detalle
concreto (nombres de instituciones, cifras oficiales si existen, fechas exactas).

Nunca inventar una cifra, cita textual o atribucion que no este en las fuentes. Si
algo no esta claro, reflejar la incertidumbre real en vez de inventar certeza.

Cerrar con como esto se relaciona con la operacion de GCM en el corredor, en
terminos de coordinacion.

## Fase 4: confirmacion de Vera (SEO)

**Obligatoria. No se salta y no vale autoaprobarse.**

El dueno fue explicito: todo articulo pasa por una confirmacion real de Vera antes de
publicarse, porque el objetivo es atraer trafico y el SEO tiene que ser impecable.
Esto no es un chequeo mental: se invoca un sub-agente independiente con la herramienta
Agent, que revise con ojos frescos y sin el sesgo de quien escribio.

Darle a Vera el titulo propuesto, la meta description, el slug, el borrador completo,
la lista de fuentes, y pedirle que revise:

1. **Palabra clave primaria:** cual es, y que aparezca en titulo, H1, meta
   description y primer parrafo.
2. **Secundarias o long-tail** relevantes al tema y al corredor: al menos 2 o 3
   presentes de forma natural, nunca forzadas ni repetidas artificialmente.
3. **Titulo SEO** de 60 caracteres o menos y **meta description** de 155 o menos,
   ambos con la palabra clave primaria, sin sonar a clickbait.
4. **Slug** limpio y descriptivo, y si el tema amerita mencionarlo en el H1.
5. **Estructura de encabezados** logica: un solo H1, H2 que dividan el contenido de
   forma comprensible para lector y buscador.
6. **Enlazado interno:** que enlace a paginas de ruta o articulos evergreen
   relevantes (guia del corredor, DUCA-T, Incoterms) cuando aplique, con anchor text
   descriptivo, sin canibalizar esas paginas ya posicionadas.
7. **GEO/AEO:** que el primer parrafo responda la pregunta central en menos de 40
   palabras de forma autocontenida, y que el schema JSON-LD planeado (NewsArticle mas
   BreadcrumbList, y FAQPage si aplica) este completo.
8. **Sin canibalizacion** de keywords contra articulos ya publicados.

Vera responde con veredicto explicito: **APROBADO** o **NECESITA_AJUSTES** con lista
concreta y accionable.

Si NECESITA_AJUSTES: aplicar y volver a someter a un segundo sub-agente Vera. Maximo
dos rondas. Si en la segunda ronda sigue sin aprobar por algo que no se puede resolver
sin inventar informacion, usar criterio, dejar constancia de la objecion sin resolver
y continuar. No se deja de publicar una noticia bien verificada por una diferencia de
opinion de optimizacion menor.

No avanzar a la Fase 5 sin el veredicto.

## Fase 5: construccion de la pagina

Usar `blog/incoterms-transporte-terrestre-centroamerica.html` como plantilla exacta
de estructura. Adaptar:

- **Schema JSON-LD:** `@graph` con BreadcrumbList mas NewsArticle (tipo NewsArticle,
  `datePublished` igual a la fecha editorial). Si el contenido se presta a una a tres
  preguntas naturales, agregar FAQPage. Opcional, solo si es natural.
- **Seccion de FUENTES:** al final del contenido, antes del disclaimer, una lista
  VISIBLE (no oculta) con el nombre de cada fuente y su URL como enlace real.
- **Disclaimer:** un `details` con `summary` que diga "Sobre este resumen",
  colapsado por defecto, inmediatamente despues de las fuentes, con EXACTAMENTE este
  texto, sin cambiarlo ni resumirlo:

> Este resumen tiene caracter informativo y editorial. No constituye asesoria legal,
> financiera, aduanera ni de comercio exterior, y no debe usarse como base unica para
> decisiones operativas o de inversion. Su proposito es aportar contexto sobre el
> desarrollo del sector logistico centroamericano. El contenido se elabora
> contrastando las fuentes citadas al pie de cada articulo mediante un proceso de
> verificacion automatizado. La informacion proveniente de fuentes externas puede
> actualizarse, corregirse o quedar desactualizada con el tiempo. Si identifica una
> imprecision, puede reportarla a ventas@gcm.com.sv. Las correcciones se revisan y
> publican cuando corresponde.

- **Enlaces internos naturales:** si la noticia se relaciona con una ruta especifica o
  con un articulo evergreen ya existente, enlazarlo con anchor text descriptivo. No
  forzarlo si no aplica.
- **CTA de cierre** estandar del sitio (WhatsApp y formulario), igual que los otros
  articulos.

## Fase 6: hub y sitemap

1. Agregar la nueva edicion arriba de la lista en `blog/noticias/index.html` (mas
   reciente primero).
2. Verificar que `blog/index.html` enlace hacia `blog/noticias/`.
3. Agregar la nueva URL a `sitemap.xml` con el formato ya usado, `changefreq weekly`
   y `priority 0.6`.
4. Agregar la redireccion de canonicalizacion en `netlify.toml`, siguiendo el patron
   de las ediciones anteriores (`.html` hacia la URL limpia, con `force = true`).

## Fase 7: verificacion

**Primero, obligatorio:** correr el verificador del proyecto.

```bash
git add -A && ./scripts/verificar-antes-de-publicar.sh --staged
```

Ese script es la autoridad, no el criterio propio. Si sale con codigo distinto de
cero, NO publicar: leer lo que reporta, corregir el TEXTO del articulo, y volver a
correrlo hasta que pase. Nunca modificar el verificador para que pase, y nunca usar
`--no-verify`.

**Despues, a mano**, lo que el script no comprueba:

1. Que el JSON-LD del articulo nuevo sea JSON valido.
2. Si se incluyo FAQPage, que el texto visible coincida exacto con el del schema.
3. Que la Fase 4 se completo con un sub-agente Vera real y cual fue el veredicto.

## Fase 8: mostrar y publicar

Como ahora el proceso es a pedido y hay un humano presente, **no se publica sin
mostrarle antes al dueno**: presentar el titulo, la meta description, las noticias que
pasaron la barra con sus fuentes, y el veredicto de Vera. Si el dueno aprueba, commit y
push. Si pide cambios, aplicarlos.

La excepcion es si el dueno dijo explicitamente "publicalo directo" al pedir el
articulo.

En el resumen final, incluir siempre una linea con el veredicto de Vera (por ejemplo
"Vera: APROBADO", o "Vera: objecion sin resolver, [detalle]") para que quede constancia.
