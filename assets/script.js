/* ---------- Thème clair / sombre ---------- */
(function () {
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('asavao-theme'); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var initial = stored || (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', initial);

  window.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', initial === 'dark' ? 'true' : 'false');
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', current);
      toggle.setAttribute('aria-pressed', current === 'dark' ? 'true' : 'false');
      try { localStorage.setItem('asavao-theme', current); } catch (e) {}
    });
  });
})();

/* ---------- Menu mobile ---------- */
var navToggle = document.getElementById('nav-toggle');
var navLinks = document.getElementById('nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { navLinks.classList.remove('open'); });
  });
}

/* ---------- Recherche (page Services) ---------- */
var search = document.getElementById('search');
if (search) {
  search.addEventListener('input', function () {
    var query = search.value.toLowerCase().trim();
    document.querySelectorAll('.service-card').forEach(function (card) {
      var content = ((card.dataset.title || '') + ' ' + (card.dataset.cat || '')).toLowerCase();
      card.style.display = content.indexOf(query) !== -1 ? '' : 'none';
    });
  });
}

/* ---------- Confirmation avant commande ---------- */
document.querySelectorAll('.order-card').forEach(function (card) {
  card.addEventListener('click', function (event) {
    var service = card.dataset.service || 'cette prestation';
    var formule = card.dataset.formule || 'sélectionnée';
    var prix = card.dataset.prix || '';
    var message = 'Souhaitez-vous commander la formule « ' + formule + ' » pour « ' + service + ' »' +
      (prix ? ' au tarif affiché de ' + prix : '') + ' ?';
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  });
});

/* ---------- Formulaire de contact (préremplissage + envoi Web3Forms) ---------- */
var contactForm = document.getElementById('contact-form');
if (contactForm) {
  var params = new URLSearchParams(window.location.search);
  var serviceValue = params.get('service') || '';
  var formulaValue = params.get('formule') || '';
  var priceValue = params.get('prix') || '';

  var serviceInput = document.getElementById('service');
  var formulaInput = document.getElementById('formule');
  var priceInput = document.getElementById('prix');
  var subjectInput = document.getElementById('subject-field');
  var summary = document.getElementById('order-summary');
  var summaryTitle = document.getElementById('order-summary-title');
  var summaryDetails = document.getElementById('order-summary-details');

  if (serviceValue) serviceInput.value = serviceValue;
  if (formulaValue) formulaInput.value = formulaValue;
  if (priceValue) priceInput.value = priceValue;

  if (serviceValue || formulaValue || priceValue) {
    summary.hidden = false;
    summaryTitle.textContent = serviceValue || 'Demande de prestation';
    summaryDetails.textContent = [
      formulaValue && ('Formule : ' + formulaValue),
      priceValue && ('Tarif affiché : ' + priceValue)
    ].filter(Boolean).join(' — ');
    subjectInput.value = 'Demande de commande — ' + (serviceValue || 'Prestation') + (formulaValue ? ' — ' + formulaValue : '');
  }

  contactForm.addEventListener('submit', function (event) {
    event.preventDefault();

    var result = document.getElementById('form-result');
    var button = document.getElementById('submit-button');
    var key = document.getElementById('web3forms-access-key').value.trim();

    result.className = 'form-result';
    result.textContent = '';

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    if (!key || key === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      result.className = 'form-result error';
      result.textContent = "Le formulaire n'est pas encore activé : ajoutez votre clé d'accès Web3Forms dans contact.html.";
      return;
    }

    button.disabled = true;
    button.textContent = 'Envoi en cours…';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: new FormData(contactForm)
    })
      .then(function (response) {
        return response.json().then(function (data) { return { ok: response.ok, data: data }; });
      })
      .then(function (res) {
        if (!res.ok || !res.data.success) {
          throw new Error((res.data && res.data.message) || "L'envoi a échoué.");
        }
        result.className = 'form-result success';
        result.textContent = 'Votre demande a bien été envoyée. Nous vous répondrons dès que possible.';
        contactForm.reset();
        if (serviceValue) serviceInput.value = serviceValue;
        if (formulaValue) formulaInput.value = formulaValue;
        if (priceValue) priceInput.value = priceValue;
      })
      .catch(function (error) {
        result.className = 'form-result error';
        result.textContent = (error && error.message) || 'Une erreur est survenue. Veuillez réessayer.';
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = 'Envoyer la demande';
      });
  });
}

/* ---------- Portfolio : accordéon des groupes ---------- */
var portfolioGroups = Array.prototype.slice.call(document.querySelectorAll('.portfolio-group'));

function setPortfolioGroup(group, open, updateHash) {
  var button = group.querySelector('.portfolio-group-toggle');
  var panel = group.querySelector('.portfolio-group-panel');
  if (!button || !panel) return;
  button.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
  group.classList.toggle('is-open', open);
  if (open && updateHash) {
    history.replaceState(null, '', '#' + group.id);
  }
}

portfolioGroups.forEach(function (group) {
  var button = group.querySelector('.portfolio-group-toggle');
  if (!button) return;
  button.addEventListener('click', function () {
    var willOpen = button.getAttribute('aria-expanded') !== 'true';
    portfolioGroups.forEach(function (otherGroup) { setPortfolioGroup(otherGroup, false); });
    setPortfolioGroup(group, willOpen, willOpen);
  });
});

if (portfolioGroups.length) {
  var hash = decodeURIComponent(window.location.hash.slice(1));
  var targetedGroup = hash ? document.getElementById(hash) : null;
  if (targetedGroup && targetedGroup.classList.contains('portfolio-group')) {
    portfolioGroups.forEach(function (group) { setPortfolioGroup(group, group === targetedGroup); });
    requestAnimationFrame(function () { targetedGroup.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }
}

/* ---------- Révélation douce au défilement ---------- */
var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion && 'IntersectionObserver' in window) {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });
}
