/* ASAVAO — interactions (vanilla JS, ~4 Ko) */
(function () {
  'use strict';
  var d = document;

  /* ---------- thème clair / sombre ---------- */
  var root = d.documentElement;
  var tBtn = d.getElementById('theme-toggle');
  if (tBtn) {
    tBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      tBtn.setAttribute('aria-pressed', String(next === 'dark'));
      try { localStorage.setItem('asavao-theme', next); } catch (e) {}
    });
  }

  /* ---------- menu mobile ---------- */
  var nBtn = d.getElementById('nav-toggle');
  var links = d.getElementById('nav-links');
  if (nBtn && links) {
    nBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      nBtn.setAttribute('aria-expanded', String(open));
      nBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
  }

  /* ---------- recherche + filtres (catalogue) ---------- */
  var search = d.getElementById('search');
  if (search) {
    var cards = [].slice.call(d.querySelectorAll('[data-title]'));
    var chips = [].slice.call(d.querySelectorAll('.chip'));
    var headings = [].slice.call(d.querySelectorAll('.cat-heading'));
    var counter = d.getElementById('count-line');
    var empty = d.getElementById('no-result');
    var cat = '';

    function norm(s) {
      return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }
    function apply() {
      var q = norm(search.value.trim());
      var n = 0;
      cards.forEach(function (c) {
        var okQ = !q || norm(c.getAttribute('data-title') + ' ' + c.getAttribute('data-cat')).indexOf(q) !== -1;
        var okC = !cat || c.getAttribute('data-cat') === cat;
        var show = okQ && okC;
        c.style.display = show ? '' : 'none';
        if (show) n++;
      });
      headings.forEach(function (h) {
        var slug = h.getAttribute('data-group');
        var any = cards.some(function (c) {
          return c.getAttribute('data-group') === slug && c.style.display !== 'none';
        });
        h.style.display = any ? '' : 'none';
      });
      if (counter) counter.textContent = n + (n > 1 ? ' services affichés' : ' service affiché');
      if (empty) empty.style.display = n ? 'none' : 'block';
    }
    try {
      var q0 = new URLSearchParams(location.search).get('q');
      if (q0) search.value = q0;
    } catch (e) {}
    search.addEventListener('input', apply);
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        var v = ch.getAttribute('data-cat') || '';
        cat = (cat === v) ? '' : v;
        chips.forEach(function (o) {
          var on = (o.getAttribute('data-cat') || '') === cat;
          o.classList.toggle('active', on);
          o.setAttribute('aria-pressed', String(on));
        });
        apply();
      });
    });
    apply();
  }

  /* ---------- ouvrir l'accordéon ciblé par l'ancre ---------- */
  function openHash() {
    if (!location.hash) return;
    var el = d.getElementById(location.hash.slice(1));
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView(); }
  }
  openHash();
  window.addEventListener('hashchange', openHash);

  /* ---------- exemple : déplier / replier ---------- */
  [].slice.call(d.querySelectorAll('.sample-wrap')).forEach(function (w) {
    var btn = w.parentElement.querySelector('.sample-toggle');
    var sample = w.querySelector('.sample');
    if (!btn || !sample) return;
    if (sample.scrollHeight <= 470) { w.classList.remove('clamped'); btn.style.display = 'none'; return; }
    btn.addEventListener('click', function () {
      var clamped = w.classList.toggle('clamped');
      btn.textContent = clamped ? 'Voir l’exemple complet' : 'Replier l’exemple';
      btn.setAttribute('aria-expanded', String(!clamped));
      if (clamped) w.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- contact : pré-remplissage + envoi ---------- */
  var form = d.getElementById('contact-form');
  if (form) {
    try {
      var p = new URLSearchParams(location.search);
      var service = p.get('service'), formule = p.get('formule'), prix = p.get('prix');
      if (service) {
        var fS = d.getElementById('service'); if (fS) fS.value = service;
        var box = d.getElementById('order-summary');
        var det = d.getElementById('order-summary-details');
        var sub = d.getElementById('subject-field');
        if (formule) { var fF = d.getElementById('formule'); if (fF) fF.value = formule; }
        if (prix) { var fP = d.getElementById('prix'); if (fP) fP.value = prix; }
        if (box && det) {
          det.textContent = service + (formule ? ' — formule ' + formule : '') + (prix ? ' (' + prix + ')' : '');
          box.hidden = false;
        }
        if (sub) sub.value = 'Commande : ' + service + (formule ? ' — ' + formule : '');
      }
    } catch (e) {}

    var result = d.getElementById('form-result');
    var submitBtn = d.getElementById('submit-button');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      data.delete('botcheck');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Envoi en cours…'; }
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(data)),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
      }).then(function (r) { return r.json(); }).then(function (r) {
        if (result) {
          result.className = 'form-result ' + (r.success ? 'ok' : 'err');
          result.textContent = r.success
            ? 'Demande envoyée. Nous revenons vers vous rapidement par email.'
            : 'L’envoi a échoué. Réessayez ou écrivez-nous à contact@asavaomada.dev.';
        }
        if (r.success) form.reset();
      }).catch(function () {
        if (result) {
          result.className = 'form-result err';
          result.textContent = 'Connexion impossible. Écrivez-nous à contact@asavaomada.dev.';
        }
      }).finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Envoyer la demande'; }
      });
    });
  }

  /* ---------- consentement cookies (RGPD) ---------- */
  var KEY = 'asavao-consent', SIX_MONTHS = 15778800000;
  var banner = d.getElementById('consent-banner');
  function readConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && Date.now() - c.t < SIX_MONTHS) return c.v;
    } catch (e) {}
    return null;
  }
  function saveConsent(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }
  function purgeGA() {
    try {
      document.cookie.split(';').forEach(function (x) {
        var n = x.split('=')[0].trim();
        if (n.indexOf('_ga') === 0) {
          document.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
          document.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' + location.hostname;
        }
      });
    } catch (e) {}
  }
  if (banner) {
    var showB = function () { banner.hidden = false; };
    var hideB = function () { banner.hidden = true; };
    if (readConsent() === null) showB();
    var acc = d.getElementById('consent-accept');
    var ref = d.getElementById('consent-refuse');
    if (acc) acc.addEventListener('click', function () {
      saveConsent('granted'); hideB();
      if (window.__loadGA) window.__loadGA();
    });
    if (ref) ref.addEventListener('click', function () {
      saveConsent('denied'); hideB(); purgeGA();
    });
    var manage = d.getElementById('manage-cookies');
    if (manage) manage.addEventListener('click', function () { showB(); });
  }

  /* ---------- apparition douce au défilement ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    [].slice.call(d.querySelectorAll('.reveal')).forEach(function (el) { io.observe(el); });
  } else {
    [].slice.call(d.querySelectorAll('.reveal')).forEach(function (el) { el.classList.add('in'); });
  }
})();
