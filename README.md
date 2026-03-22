# GCM Logistica

Sitio web de **GCM Logistica** — transporte terrestre de carga en Centroamerica, Panama y hasta Ciudad Hidalgo, Chiapas.

## Estructura

```
index.html          Pagina principal (landing)
tracking.html       Consulta de envios (conecta con Google Sheets via Apps Script)
css/styles.css      Hoja de estilos
js/main.js          JavaScript principal (nav, animaciones, mapa)
js/tracking.js      Logica de consulta de envios
js/apps-script.gs   Codigo del Google Apps Script (referencia)
imagenes/           Imagenes del sitio
favicons/           Iconos del sitio
Cook Conthic/       Fuente CookConthic (titulos)
avenir-lt-pro/      Fuente AvenirLTPro (cuerpo)
seo/                Estrategia SEO
robots.txt          Directivas para crawlers
sitemap.xml         Mapa del sitio
```

## Consulta de envios

El sistema de tracking permite a los clientes consultar el estado de su carga ingresando un correlativo LDF. La consulta se realiza contra una hoja de Google Sheets privada a traves de un Google Apps Script desplegado como web app publica.
