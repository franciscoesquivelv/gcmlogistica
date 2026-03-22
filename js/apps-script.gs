/**
 * GCM Logística — Apps Script Web App
 * ─────────────────────────────────────────────────────────────────────
 * Este código corre en Google, NO en el sitio web.
 * El Sheet puede estar PRIVADO — el script lo lee con tus credenciales.
 * El sitio web solo habla con este script, nunca con el Sheet directamente.
 *
 * CÓMO INSTALAR (una sola vez, ~5 minutos):
 * ─────────────────────────────────────────────────────────────────────
 * 1. Abre tu Google Sheet
 * 2. Menú superior → Extensiones → Apps Script
 * 3. Se abre un editor de código en una nueva pestaña
 * 4. Borra TODO lo que haya en el editor (suele haber una función vacía)
 * 5. Copia y pega TODO el contenido de este archivo
 * 6. Haz clic en el ícono de guardar (💾) o Ctrl+S
 * 7. Haz clic en "Implementar" → "Nueva implementación"
 *      - Tipo: Aplicación web
 *      - Ejecutar como: Yo (tu-correo@gmail.com)   ← IMPORTANTE
 *      - Quién tiene acceso: Cualquier persona       ← solo el script es público, el Sheet no
 * 8. Haz clic en "Implementar"
 * 9. Google te pedirá que autorices permisos → "Permitir"
 * 10. Copia la URL que aparece (empieza con https://script.google.com/macros/s/...)
 * 11. Pégala en tracking.js → CONFIG.APPS_SCRIPT_URL
 * ─────────────────────────────────────────────────────────────────────
 * IMPORTANTE: Cada vez que modifiques este código debes hacer
 * "Implementar → Administrar implementaciones → Editar → Nueva versión"
 * ─────────────────────────────────────────────────────────────────────
 */

// ── CONFIGURACIÓN ────────────────────────────────────────────────────
const SPREADSHEET_ID  = '1EwEVt5FbL01u8bZzWjpEjk4Gap-SWMykuEUiYMiBKdY';
const DATA_SHEET      = 'Registro Maestro';
const ANALYTICS_SHEET = 'Analytics Tracking';
const HEADER_ROWS     = 2;   // fila 1 = título, fila 2 = encabezados

// Columnas del Sheet (índice 0-based)
const COL_CORRELATIVO  = 0;   // Columna A
const COL_ESTADO       = 21;  // Columna V
const COL_NOTAS        = 22;  // Columna W
const COL_FECHA        = 23;  // Columna X

const EMAIL_FROM_NAME  = 'GCM Logística';
const EMAIL_SUBJECT    = 'Estado de su envío — GCM Logística';

// ── CORS — necesario para que el browser pueda llamar al script ───────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonOut(obj, code) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET — consulta de estado en pantalla ─────────────────────────────
// URL: .../exec?action=lookup&correlativo=LDF-2026-0175
function doGet(e) {
  const action      = e.parameter.action || '';
  const correlativo = (e.parameter.correlativo || '').trim().toUpperCase();

  if (action === 'lookup' && correlativo) {
    const result = lookupShipment(correlativo);
    logEvent('screen', correlativo, result.found, '');
    return jsonOut(result);
  }

  return jsonOut({ ok: false, error: 'Parámetros inválidos' });
}

// ── POST — envío de correo + log ─────────────────────────────────────
function doPost(e) {
  try {
    const raw     = e.parameter.payload || (e.postData && e.postData.contents) || '{}';
    const payload = JSON.parse(raw);
    const corr    = (payload.correlativo || '').trim().toUpperCase();

    if (payload.action === 'email' && payload.email) {
      // Buscar el estado para incluirlo en el correo
      const shipment = lookupShipment(corr);
      sendStatusEmail(corr, payload.email, shipment);
      logEvent('email', corr, shipment.found, payload.email);
      return jsonOut({ ok: true });
    }

    if (payload.action === 'log') {
      logEvent(payload.mode || 'screen', corr, payload.found, payload.email || '');
      return jsonOut({ ok: true });
    }

    if (payload.action === 'contact') {
      sendContactEmail(payload);
      return jsonOut({ ok: true });
    }

    return jsonOut({ ok: false, error: 'Acción no reconocida' });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

// ── BUSCAR ENVÍO EN EL SHEET ─────────────────────────────────────────
function lookupShipment(correlativo) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(DATA_SHEET);

  if (!sheet) return { ok: false, found: false, error: 'Hoja no encontrada' };

  // Los datos empiezan después de las filas de encabezado
  const firstDataRow = HEADER_ROWS + 1;
  const lastRow      = sheet.getLastRow();

  if (lastRow < firstDataRow) return { ok: true, found: false };

  const numRows = lastRow - firstDataRow + 1;
  // Leer solo las columnas que necesitamos (A y V:X)
  const allData = sheet.getRange(firstDataRow, 1, numRows, COL_FECHA + 1).getValues();

  for (const row of allData) {
    const cellCorr = (row[COL_CORRELATIVO] || '').toString().trim().toUpperCase();
    if (cellCorr === correlativo) {
      const fechaRaw = row[COL_FECHA];
      const fecha    = fechaRaw instanceof Date
        ? Utilities.formatDate(fechaRaw, Session.getScriptTimeZone(), 'dd/MM/yyyy')
        : (fechaRaw || '').toString().trim();

      return {
        ok:           true,
        found:        true,
        estado:       (row[COL_ESTADO] || '').toString().trim(),
        notas:        (row[COL_NOTAS]  || '').toString().trim(),
        fechaEntrega: fecha,
      };
    }
  }

  return { ok: true, found: false };
}

// ── ENVIAR CORREO ────────────────────────────────────────────────────
function sendStatusEmail(correlativo, email, shipment) {
  const estado       = shipment.found ? shipment.estado       : 'No disponible';
  const notas        = shipment.found ? shipment.notas        : '';
  const fechaEntrega = shipment.found ? shipment.fechaEntrega : 'Por confirmar';

  const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0a1628;color:#eef3fa;padding:32px;border-radius:8px">
  <h2 style="color:#4A8FD4;margin:0 0 8px">GCM Logística</h2>
  <p style="margin:0 0 24px;color:#8b9ab8;font-size:13px">Actualización de estado de envío</p>
  <h3 style="margin:0 0 24px;font-size:20px;letter-spacing:-0.01em">${esc(correlativo)}</h3>
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1e3a5f;color:#8b9ab8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;width:40%">Estado actual</td>
      <td style="padding:12px 0;border-bottom:1px solid #1e3a5f;font-weight:600">${esc(estado)}</td>
    </tr>
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1e3a5f;color:#8b9ab8;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Fecha estimada</td>
      <td style="padding:12px 0;border-bottom:1px solid #1e3a5f;font-weight:600">${esc(fechaEntrega)}</td>
    </tr>
    ${notas ? `<tr>
      <td style="padding:12px 0;color:#8b9ab8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">Nota</td>
      <td style="padding:12px 0">${esc(notas)}</td>
    </tr>` : ''}
  </table>
  <p style="margin:28px 0 0;font-size:12px;color:#8b9ab8;border-top:1px solid #1e3a5f;padding-top:20px">
    GCM Logística — Transporte terrestre centroamericano
  </p>
</div>`;

  const plain =
    `Correlativo: ${correlativo}\n` +
    `Estado: ${estado}\n` +
    `Fecha estimada: ${fechaEntrega}\n` +
    (notas ? `Nota: ${notas}\n` : '') +
    `\nGCM Logística`;

  GmailApp.sendEmail(email, EMAIL_SUBJECT, plain, {
    htmlBody: html,
    name:     EMAIL_FROM_NAME,
  });
}

// ── REGISTRAR ANALYTICS ──────────────────────────────────────────────
function logEvent(mode, correlativo, found, email) {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(ANALYTICS_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(ANALYTICS_SHEET);
    const headers = [['Fecha y Hora', 'Correlativo LDF', 'Modo', 'Correo', 'Encontrado']];
    sheet.getRange(1, 1, 1, 5).setValues(headers).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 80);
    sheet.setColumnWidth(4, 200);
    sheet.setColumnWidth(5, 90);
  }

  sheet.appendRow([
    new Date(),
    correlativo,
    mode,
    email || '',
    found ? 'Sí' : 'No',
  ]);
}

// ── CORREO DE CONTACTO ───────────────────────────────────────────────
function sendContactEmail(p) {
  const nombre     = p.nombre     || 'No indicado';
  const empresa    = p.empresa    || 'No indicada';
  const origen     = p.origen     || 'No indicado';
  const destino    = p.destino    || 'No indicado';
  const tipo_carga = p.tipo_carga || 'No indicado';
  const mensaje    = p.mensaje    || '';

  const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0a1628;color:#eef3fa;padding:32px;border-radius:8px">
  <h2 style="color:#4A8FD4;margin:0 0 8px">GCM Logística</h2>
  <p style="margin:0 0 24px;color:#8b9ab8;font-size:13px">Nueva consulta desde el sitio web</p>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e3a5f;color:#8b9ab8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;width:40%">Nombre</td><td style="padding:10px 0;border-bottom:1px solid #1e3a5f;font-weight:600">${esc(nombre)}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e3a5f;color:#8b9ab8;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Empresa</td><td style="padding:10px 0;border-bottom:1px solid #1e3a5f">${esc(empresa)}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e3a5f;color:#8b9ab8;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Origen</td><td style="padding:10px 0;border-bottom:1px solid #1e3a5f">${esc(origen)}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e3a5f;color:#8b9ab8;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Destino</td><td style="padding:10px 0;border-bottom:1px solid #1e3a5f">${esc(destino)}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e3a5f;color:#8b9ab8;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Tipo de carga</td><td style="padding:10px 0;border-bottom:1px solid #1e3a5f">${esc(tipo_carga)}</td></tr>
    ${mensaje ? `<tr><td style="padding:10px 0;color:#8b9ab8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">Mensaje</td><td style="padding:10px 0">${esc(mensaje)}</td></tr>` : ''}
  </table>
  <p style="margin:28px 0 0;font-size:12px;color:#8b9ab8;border-top:1px solid #1e3a5f;padding-top:20px">GCM Logística — sitio web</p>
</div>`;

  const plain =
    `Nueva consulta desde el sitio web\n\n` +
    `Nombre: ${nombre}\nEmpresa: ${empresa}\nOrigen: ${origen}\nDestino: ${destino}\nTipo de carga: ${tipo_carga}\n` +
    (mensaje ? `Mensaje: ${mensaje}\n` : '');

  GmailApp.sendEmail('ventas@gcm.com.sv', `Nueva consulta — ${nombre} / ${empresa}`, plain, {
    htmlBody: html,
    name:     EMAIL_FROM_NAME,
  });
}

// ── HELPER ───────────────────────────────────────────────────────────
function esc(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
