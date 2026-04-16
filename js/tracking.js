/**
 * GCM Logística — Sistema de Consulta de Envíos
 *
 * Consultas y correos vía Google Apps Script web app (Sheet permanece privado).
 *
 * ─── PENDIENTE DE CONFIGURAR ──────────────────────────────────────────
 * APPS_SCRIPT_URL: después de desplegar el Apps Script en script.google.com,
 * pegue la URL del web app en la constante de abajo.
 * El archivo apps-script.gs (en esta carpeta) contiene el código a usar.
 * ─────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ─── CONFIGURACIÓN ────────────────────────────────────────────── */
  const CONFIG = {
    // ⚠️ Pegar URL del Apps Script web app aquí (ver apps-script.gs)
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwwuXjehJoLlIoirEWTyncn7RE4K3IHKJuXRbsfRYY7ZXLycloC5ujPKZPpIyEelTGbew/exec',
  };

  /* ─── PIPELINE DE ESTADOS ─────────────────────────────────────── */
  // Orden cronológico real de los 5 estados del sistema
  const STAGES = [
    { key: 'confirmado', label: 'Confirmado',  match: ['confirmado'] },
    { key: 'despachado', label: 'Despachado',  match: ['despachado'] },
    { key: 'transito',   label: 'En Tránsito', match: ['tránsito', 'transito'] },
    { key: 'demora',     label: 'En Demora',   match: ['demora'],   isDelay: true },
    { key: 'completado', label: 'Completado',  match: ['completado'] },
  ];

  /* ─── INIT ────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initTrackingPage();
    checkURLParams();
  });

  function initTrackingPage() {
    const tabs     = document.querySelectorAll('.trk-tab');
    const form     = document.getElementById('trkForm');
    const emailGrp = document.getElementById('trkEmailGroup');
    const descScr  = document.getElementById('trkDescScreen');
    const descEml  = document.getElementById('trkDescEmail');

    if (!form) return;

    let currentMode = 'screen';

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        currentMode = tab.dataset.mode;

        const isEmail = currentMode === 'email';
        if (emailGrp) emailGrp.style.display = isEmail ? 'flex' : 'none';
        if (descScr)  descScr.style.display  = isEmail ? 'none' : 'block';
        if (descEml)  descEml.style.display  = isEmail ? 'block' : 'none';

        const emailInput = document.getElementById('trkEmail');
        if (emailInput) emailInput.required = isEmail;

        hideResult();
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const correlativo = document.getElementById('trkCorrelativo')?.value.trim();
      const email       = document.getElementById('trkEmail')?.value.trim();
      if (!correlativo) return;

      setLoading(true);
      hideResult();

      if (currentMode === 'screen') {
        await handleScreenLookup(correlativo);
      } else {
        await handleEmailRequest(correlativo, email);
      }

      setLoading(false);
    });

    document.getElementById('trkRetry')?.addEventListener('click', () => {
      hideResult();
      document.getElementById('trkCorrelativo')?.focus();
    });
    document.getElementById('trkNewQuery')?.addEventListener('click', () => {
      hideResult();
      document.getElementById('trkForm')?.reset();
      document.getElementById('trkCorrelativo')?.focus();
    });
  }

  /* ─── URL PARAMS — auto-consulta desde homepage ───────────────── */
  function checkURLParams() {
    const params      = new URLSearchParams(window.location.search);
    const correlativo = params.get('correlativo');
    const mode        = params.get('mode') || 'screen';
    const email       = params.get('email');

    if (!correlativo) return;

    const corrInput = document.getElementById('trkCorrelativo');
    if (corrInput) corrInput.value = correlativo;

    if (mode === 'email' && email) {
      document.querySelector('.trk-tab[data-mode="email"]')?.click();
      const emailInput = document.getElementById('trkEmail');
      if (emailInput) emailInput.value = email;
    }

    setTimeout(() => {
      document.getElementById('trkForm')?.requestSubmit?.() ||
      document.getElementById('trkForm')?.dispatchEvent(new Event('submit', { bubbles: true }));
    }, 400);
  }

  /* ─── SCREEN LOOKUP ───────────────────────────────────────────── */
  async function handleScreenLookup(correlativo) {
    if (!CONFIG.APPS_SCRIPT_URL) {
      showError('El sistema de consultas no está configurado aún. Contáctenos directamente.');
      return;
    }
    try {
      const url  = `${CONFIG.APPS_SCRIPT_URL}?action=lookup&correlativo=${encodeURIComponent(correlativo)}`;
      const res  = await fetch(url);
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || 'Error del servidor');

      if (data.found) {
        showStatusCard(correlativo, data);
        logEvent('screen', correlativo, true);
      } else {
        showError(
          `No encontramos un envío con el correlativo "${correlativo}". ` +
          'Verifique el número e intente de nuevo, o contáctenos directamente.'
        );
        logEvent('screen', correlativo, false);
      }
    } catch (err) {
      console.error('[GCM Tracking]', err);
      showError(
        'No pudimos conectarnos al sistema en este momento. ' +
        'Intente de nuevo en unos minutos o contáctenos directamente.'
      );
    }
  }

  /* ─── EMAIL REQUEST ───────────────────────────────────────────── */
  async function handleEmailRequest(correlativo, email) {
    if (!email) {
      showError('Por favor ingrese su correo electrónico.');
      return;
    }

    if (!CONFIG.APPS_SCRIPT_URL) {
      showError('El sistema de correo no está configurado aún. Contáctenos directamente.');
      return;
    }

    // El Apps Script busca el estado y envía el correo en un solo paso
    try {
      const fd = new FormData();
      fd.append('payload', JSON.stringify({ action: 'email', correlativo, email }));
      await fetch(CONFIG.APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: fd });
    } catch (_) { /* silent — mode: no-cors siempre lanza, pero el request llega */ }

    showEmailSent(email);
  }

  /* ─── SHOW STATUS CARD ────────────────────────────────────────── */
  // data = { estado, notas, fechaEntrega } de Apps Script
  function showStatusCard(correlativo, data) {
    const estado       = data.estado       || '';
    const notas        = data.notas        || '';
    const fechaEntrega = data.fechaEntrega || '';

    // Correlativo
    setText('trkResultCorrelativo', correlativo.toUpperCase());

    // Badge de estado
    const badgeEl = document.getElementById('trkResultBadge');
    if (badgeEl) {
      badgeEl.textContent = estado || 'Sin estado';
      badgeEl.className   = 'trk-result__badge';
      const lower = estado.toLowerCase();
      if (lower.includes('completado'))            badgeEl.classList.add('badge--delivered');
      else if (lower.includes('demora'))           badgeEl.classList.add('badge--delayed');
      else if (lower.includes('tránsito') || lower.includes('transito') ||
               lower.includes('despachado'))       badgeEl.classList.add('badge--active');
    }

    // Fecha estimada de entrega
    setText('trkResultFecha', fechaEntrega || 'Por confirmar');

    // Timeline
    buildTimeline(estado);

    // Nota del estado
    const obsEl   = document.getElementById('trkResultObs');
    const obsText = document.getElementById('trkObsText');
    if (obsEl) {
      if (notas && obsText) {
        obsText.textContent  = notas;
        obsEl.style.display  = 'block';
      } else {
        obsEl.style.display  = 'none';
      }
    }

    showResult('trkResultCard');
  }

  /* ─── TIMELINE ────────────────────────────────────────────────── */
  function buildTimeline(currentState) {
    const container = document.getElementById('trkTimeline');
    if (!container) return;
    container.innerHTML = '';

    const lower = currentState.toLowerCase();
    let activeIndex = -1;

    STAGES.forEach((stage, i) => {
      if (stage.match.some((kw) => lower.includes(kw))) activeIndex = i;
    });

    // Si "En Demora", lo marcamos como activo pero visualmente distinto
    // Si "Completado", los pasos intermedios (incluso En Demora) quedan como done
    STAGES.forEach((stage, i) => {
      const div = document.createElement('div');
      div.className = 'trk-stage';

      if (i < activeIndex)       div.classList.add('trk-stage--done');
      else if (i === activeIndex) div.classList.add('trk-stage--active');
      else                        div.classList.add('trk-stage--pending');

      if (stage.isDelay && i === activeIndex) div.classList.add('trk-stage--delay');

      div.innerHTML = `
        <div class="trk-stage__dot"></div>
        <div class="trk-stage__info">
          <span class="trk-stage__name">${stage.label}</span>
          ${i === activeIndex ? '<span class="trk-stage__date">Estado actual</span>' : ''}
        </div>`;
      container.appendChild(div);
    });
  }

  /* ─── ANALYTICS ───────────────────────────────────────────────── */
  // Registra cada consulta en el Apps Script (fire-and-forget, no bloquea UX)
  function logEvent(mode, correlativo, found, email) {
    if (!CONFIG.APPS_SCRIPT_URL) return;
    try {
      const fd = new FormData();
      fd.append('payload', JSON.stringify({
        action:      'log',
        mode,
        correlativo,
        found,
        email:       email || '',
        timestamp:   new Date().toISOString(),
        userAgent:   navigator.userAgent,
      }));
      fetch(CONFIG.APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: fd });
    } catch (_) {}
  }

  /* ─── UI HELPERS ──────────────────────────────────────────────── */
  function setLoading(on) {
    const txt = document.querySelector('.trk-form__submit-text');
    const ldr = document.querySelector('.trk-form__submit-loader');
    const btn = document.querySelector('.trk-form__submit');
    if (txt) txt.style.display = on ? 'none'       : 'inline';
    if (ldr) ldr.style.display = on ? 'inline-flex' : 'none';
    if (btn) btn.disabled      = on;
  }

  function showResult(cardId) {
    ['trkResultCard', 'trkEmailSent', 'trkError'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const wrap = document.getElementById('trkResult');
    const card = document.getElementById(cardId);
    if (wrap) wrap.style.display = 'block';
    if (card) card.style.display = 'block';
    setTimeout(() => wrap?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  }

  function hideResult() {
    const wrap = document.getElementById('trkResult');
    if (wrap) wrap.style.display = 'none';
  }

  function showError(msg) {
    const el = document.getElementById('trkErrorMsg');
    if (el) el.textContent = msg;
    showResult('trkError');
  }

  function showEmailSent(email) {
    const el = document.getElementById('trkEmailAddress');
    if (el) el.textContent = email;
    showResult('trkEmailSent');
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

})();
