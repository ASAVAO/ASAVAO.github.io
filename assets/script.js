/* Menu mobile */
var toggle = document.getElementById('nav-toggle');
var links = document.getElementById('nav-links');
if (toggle && links) {
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { links.classList.remove('open'); });
  });
}

/* Recherche + filtre par catégorie (page Services) */
var search = document.getElementById('search');
var cards = document.querySelectorAll('.service-card');
var activeCat = 'all';

function applyFilters() {
  var q = search ? search.value.toLowerCase().trim() : '';
  cards.forEach(function (c) {
    var matchesText = !q || c.dataset.title.indexOf(q) !== -1 || c.dataset.cat.indexOf(q) !== -1;
    var matchesCat = activeCat === 'all' || c.dataset.cat === activeCat;
    c.style.display = (matchesText && matchesCat) ? '' : 'none';
  });
}
if (search) search.addEventListener('input', applyFilters);

var catButtons = document.querySelectorAll('.cat-btn');
catButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    activeCat = btn.dataset.cat;
    catButtons.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    applyFilters();
  });
});

/* Formulaire de contact (Web3Forms) */
var contactForm = document.getElementById('contact-form');
if (contactForm) {
  var formStatus = document.getElementById('form-status');
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    formStatus.className = 'form-status';
    formStatus.textContent = 'Envoi en cours...';

    var formData = new FormData(contactForm);
    var payload = Object.fromEntries(formData);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) { return response.json().then(function (data) { return { ok: response.ok, data: data }; }); })
      .then(function (result) {
        if (result.ok) {
          formStatus.classList.add('success');
          formStatus.textContent = 'Message envoyé — merci, réponse sous 24 à 48h ouvrées.';
          contactForm.reset();
        } else {
          formStatus.classList.add('error');
          formStatus.textContent = (result.data && result.data.message) || "Une erreur est survenue. Réessayez dans quelques instants.";
        }
      })
      .catch(function () {
        formStatus.classList.add('error');
        formStatus.textContent = "Impossible d'envoyer le message pour le moment. Vérifiez votre connexion et réessayez.";
      });
  });
}

/* Révélation douce au défilement (désactivée si mouvement réduit demandé) */
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
