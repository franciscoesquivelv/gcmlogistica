# Estrategia SEO — GCM Logística
> Para que Claude Code implemente correctamente desde el inicio.

---

## META TAGS PRINCIPALES

```html
<!-- Title tag — máximo 60 caracteres -->
<title>GCM Logística | Transporte Terrestre en Centroamérica y México</title>

<!-- Meta description — máximo 155 caracteres -->
<meta name="description" content="Transporte de carga terrestre en El Salvador, Guatemala, Honduras, Nicaragua, Costa Rica, Panamá y México. +17 años de experiencia. Cadena de frío. Sin intermediarios.">

<!-- Open Graph (para compartir en redes) -->
<meta property="og:title" content="GCM Logística — Nos hacemos cargo.">
<meta property="og:description" content="Transporte terrestre confiable en Centroamérica, Panamá y México. Cadena de frío, furgones secos, trato directo.">
<meta property="og:image" content="/imagenes/og-gcm.jpg"> <!-- Imagen 1200×630px -->
<meta property="og:type" content="website">
<meta property="og:locale" content="es_SV">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">

<!-- Canonical -->
<link rel="canonical" href="https://[dominio-gcm].com/">

<!-- Idioma -->
<html lang="es">
```

---

## KEYWORDS OBJETIVO

### Primarias (alto volumen, alta competencia)
- `transporte de carga centroamérica`
- `logística centroamérica`
- `flete terrestre centroamérica`
- `transporte centroamérica`

### Secundarias (volumen medio, competencia media)
- `transporte refrigerado centroamérica`
- `cadena de frío centroamérica`
- `flete internacional centroamérica`
- `empresa de transporte El Salvador`
- `transporte de carga Guatemala Honduras`
- `logística El Salvador Guatemala`

### Long-tail (bajo volumen, baja competencia — pero muy intención de compra alta)
- `transporte de carga sin intermediarios centroamérica`
- `flete furgón seco centroamérica`
- `empresa de logística El Salvador Guatemala Honduras`
- `transporte farmacéutico centroamérica`
- `transporte de alimentos refrigerados centroamérica`
- `empresa de carga terrestre panamá centroamérica`
- `cotizar flete centroamérica`

---

## ESTRUCTURA DE HEADINGS H1 / H2 / H3

Solo debe haber UN H1 en toda la página. El resto son H2 y H3.

```
H1: Nos hacemos cargo.
  H2: Cómo trabajamos        ← sección de las tres afirmaciones (o sin H2 si el diseño lo omite)
  H2: Lo que hacemos
    H3: Furgón seco (53')
    H3: Cadena de frío controlada
    H3: Camiones de 10 toneladas
    H3: Cobertura regional completa
  H2: Una empresa que responde.
  H2: Cobertura regional — 7 países
  H2: Una empresa nueva con un equipo que lleva años en esto.
  H2: Consulte el estado de su envío
  H2: Hablemos de su operación
```

---

## SEO TÉCNICO — Instrucciones para Claude Code

### Performance
- Implementar lazy loading en todas las imágenes: `loading="lazy"`
- Imagen del hero con `loading="eager"` (no lazy — está above the fold)
- Usar formato WebP con fallback a JPG
- Minificar CSS y JS
- Meta viewport: `<meta name="viewport" content="width=device-width, initial-scale=1">`

### Schema Markup (JSON-LD)
Incluir en el `<head>` o antes del `</body>`:

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "GCM Logística",
  "description": "Transporte terrestre de carga en Centroamérica, Panamá y México. Más de 17 años de experiencia regional.",
  "url": "https://[dominio-gcm].com",
  "logo": "https://[dominio-gcm].com/imagenes/logo-gcm.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "sales",
    "availableLanguage": "Spanish"
  },
  "areaServed": [
    "El Salvador", "Guatemala", "Honduras", "Nicaragua",
    "Costa Rica", "Panamá", "México"
  ],
  "serviceType": [
    "Transporte de carga terrestre",
    "Cadena de frío",
    "Logística regional",
    "Transporte refrigerado"
  ]
}
```

### Sitemap y Robots
Por ser landing page de una sola página, incluir:
```xml
<!-- sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://[dominio-gcm].com/</loc>
    <lastmod>2026-03-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

```
# robots.txt
User-agent: *
Allow: /
Sitemap: https://[dominio-gcm].com/sitemap.xml
```

### URLs de secciones (anchors)
Para que los links directos funcionen y Google pueda indexar secciones:
```
/#servicios
/#cobertura
/#nosotros
/#tracking
/#contacto
```

---

## ESTRATEGIA DE CONTENIDO A FUTURO (Post-lanzamiento)

Para crecer en SEO orgánico después del lanzamiento, GCM debería considerar un blog o sección de recursos con artículos como:

1. "¿Cuánto cuesta un flete de El Salvador a Costa Rica?" — alta intención de compra
2. "Guía para importar con cadena de frío en Centroamérica"
3. "Cómo funciona un cruce de frontera terrestre en Centroamérica"
4. "Requisitos para transportar alimentos frescos entre países de Centroamérica"
5. "Diferencia entre furgón seco y camión refrigerado: ¿cuál necesito?"

Estos artículos capturan búsquedas de clientes potenciales que están investigando antes de cotizar.

---

## VELOCIDAD DE CARGA — Objetivo

- **First Contentful Paint:** < 1.5 segundos
- **Largest Contentful Paint:** < 2.5 segundos
- **Core Web Vitals:** Todos en verde

Para lograr esto, Claude Code debe:
- Usar una sola hoja de CSS (no múltiples archivos)
- Cargar fuentes con `font-display: swap`
- No usar librerías pesadas de JS si no son necesarias
- Comprimir todas las imágenes antes de incluirlas
