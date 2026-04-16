/**
 * GCM Logística — Main JavaScript
 * Handles: scroll animations, parallax, counters, nav, map, interactions
 */

(function () {
  'use strict';

  /* ─── DOM READY ──────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initHeroReveal();
    initNav();
    initScrollReveal();
    initParallax();
    initCounters();
    initCoverageMap();
    initServiceCardTilt();
    initScrollProgress();
    initMobileMenu();
    initTrackingWidget();
    initContactForm();
  }

  /* ─── HERO REVEAL ────────────────────────────────────────── */
  function initHeroReveal() {
    // Trigger hero animations after a short delay for polished entry
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelector('.hero__content')?.closest('section')
          ?.querySelector('.hero__content')?.closest('body')
          ?.classList.add('hero-loaded');
        document.body.classList.add('hero-loaded');
      }, 80);
    });
  }

  /* ─── NAVIGATION ─────────────────────────────────────────── */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    // Don't attach scroll listener on tracking page (always solid)
    if (document.body.classList.contains('tracking-page')) return;

    let lastScroll = 0;

    function onScroll() {
      const scrollY = window.scrollY;
      if (scrollY > 60) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
      lastScroll = scrollY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── SCROLL PROGRESS BAR ────────────────────────────────── */
  function initScrollProgress() {
    function updateProgress() {
      const doc = document.documentElement;
      const scrolled = window.scrollY;
      const total = doc.scrollHeight - doc.clientHeight;
      const progress = total > 0 ? (scrolled / total) * 100 : 0;
      doc.style.setProperty('--scroll-progress', progress + '%');
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
  }

  /* ─── SCROLL REVEAL (Intersection Observer) ──────────────── */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ─── PARALLAX ───────────────────────────────────────────── */
  function initParallax() {
    const heroBg = document.querySelector('.hero__bg');
    const aboutBg = document.querySelector('.about__bg');
    if (!heroBg && !aboutBg) return;

    // Disable on mobile (performance)
    if (window.matchMedia('(max-width: 768px)').matches) return;

    let ticking = false;

    function updateParallax() {
      const scrollY = window.scrollY;

      if (heroBg) {
        // Hero: moves up at 35% scroll speed — creates "depth" effect
        const heroHeight = heroBg.closest('.hero').offsetHeight;
        if (scrollY < heroHeight * 1.5) {
          heroBg.style.transform = `translateY(${scrollY * 0.35}px) scale(1.12)`;
        }
      }

      if (aboutBg) {
        const aboutSection = aboutBg.closest('.about');
        const rect = aboutSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const offset = (window.innerHeight - rect.top) * 0.15;
          aboutBg.style.transform = `translateY(${offset}px) scale(1.1)`;
        }
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── COUNTERS ───────────────────────────────────────────── */
  function initCounters() {
    const counters = document.querySelectorAll('.stat-item__number[data-target]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const prefix = el.dataset.prefix || '';
    const duration = 1600;
    const start = performance.now();

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOut(progress) * target);
      el.textContent = prefix + value;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /* ─── COVERAGE MAP ───────────────────────────────────────── */
  function initCoverageMap() {
    const map = document.querySelector('.coverage__map');
    if (!map) return;

    const routes = map.querySelectorAll('.map-route');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateMapRoutes(routes);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(map);

    // Country hover interaction with sidebar list
    const countries = map.querySelectorAll('.map-country');
    const countryList = document.querySelectorAll('.coverage__country');

    const countryMap = {
      'map-el-salvador': 0,
      'map-guatemala':   1,
      'map-honduras':    2,
      'map-nicaragua':   3,
      'map-costa-rica':  4,
      'map-panama':      5,
      // Ciudad Hidalgo no tiene shape propio en el SVG (es un punto de ciudad)
    };

    countries.forEach((path) => {
      path.addEventListener('mouseenter', () => {
        const idx = countryMap[path.id];
        if (idx !== undefined) {
          countryList.forEach((li) => li.classList.remove('active'));
          countryList[idx]?.classList.add('active');
        }
      });
    });
  }

  function animateMapRoutes(routes) {
    routes.forEach((line, i) => {
      // Calculate line length for dash animation
      const length = Math.hypot(
        (line.x2?.baseVal?.value || 0) - (line.x1?.baseVal?.value || 0),
        (line.y2?.baseVal?.value || 0) - (line.y1?.baseVal?.value || 0)
      );

      line.style.strokeDasharray = length;
      line.style.strokeDashoffset = length;

      setTimeout(() => {
        line.style.transition = `stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1) ${i * 250}ms, opacity 0.3s ease`;
        line.style.strokeDashoffset = '0';
        line.classList.add('animated');
      }, 100);
    });
  }

  /* ─── SERVICE CARD 3D TILT ───────────────────────────────── */
  function initServiceCardTilt() {
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const cards = document.querySelectorAll('.service-card');

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        card.style.transform = `
          translateY(-4px)
          perspective(800px)
          rotateX(${-y * 6}deg)
          rotateY(${x * 6}deg)
        `;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.4s ease, box-shadow 0.4s ease';
        setTimeout(() => { card.style.transition = ''; }, 500);
      });
    });
  }

  /* ─── MOBILE MENU ────────────────────────────────────────── */
  function initMobileMenu() {
    const burger = document.getElementById('navBurger');
    const mobileMenu = document.getElementById('navMobile');
    if (!burger || !mobileMenu) return;

    let open = false;

    burger.addEventListener('click', () => {
      open = !open;
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';

      // Animate burger → X
      const spans = burger.querySelectorAll('span');
      if (open) {
        spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
      } else {
        spans.forEach((s) => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        open = false;
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        burger.querySelectorAll('span').forEach((s) => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  /* ─── TRACKING WIDGET (homepage mini-form) ───────────────── */
  function initTrackingWidget() {
    const tabs = document.querySelectorAll('.tw-tab');
    const emailField = document.getElementById('twEmailField');
    const form = document.getElementById('twForm');
    const result = document.getElementById('twResult');
    if (!tabs.length || !form) return;

    let currentMode = 'screen';

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        currentMode = tab.dataset.mode;

        if (emailField) {
          emailField.style.display = currentMode === 'email' ? 'flex' : 'none';
          emailField.querySelector('input').required = currentMode === 'email';
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const correlativo = document.getElementById('twCorrelativo')?.value.trim();
      if (!correlativo) return;

      if (currentMode === 'screen') {
        // Redirect to full tracking page
        window.location.href = `tracking.html?correlativo=${encodeURIComponent(correlativo)}`;
      } else {
        const email = document.getElementById('twEmail')?.value.trim();
        window.location.href = `tracking.html?correlativo=${encodeURIComponent(correlativo)}&mode=email&email=${encodeURIComponent(email)}`;
      }
    });
  }

  /* ─── CONTACT FORM ───────────────────────────────────────── */
  function initContactForm() {
    const form    = document.getElementById('contactForm');
    const success = document.getElementById('cfSuccess');
    if (!form) return;

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwuXjehJoLlIoirEWTyncn7RE4K3IHKJuXRbsfRYY7ZXLycloC5ujPKZPpIyEelTGbew/exec';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'Enviando…';
      btn.disabled = true;

      const data = Object.fromEntries(new FormData(form).entries());
      data.action = 'contact';

      try {
        const fd = new FormData();
        fd.append('payload', JSON.stringify(data));
        await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: fd });
      } catch (_) {}

      form.style.display = 'none';
      if (success) success.style.display = 'block';
    });
  }

})();
