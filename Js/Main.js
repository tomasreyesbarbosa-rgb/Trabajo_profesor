(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('js');
  $('#year').textContent = new Date().getFullYear();

  /* ---------- 1. Imágenes que no cargan: mostrar recuadro de reemplazo ---------- */
  function handleBroken(img) {
    if (img.hasAttribute('data-hide-on-error')) { img.hidden = true; return; }
    const placeholder = img.nextElementSibling;
    img.hidden = true;
    if (placeholder) placeholder.hidden = false;
  }
  $$('img[data-fallback], img[data-hide-on-error]').forEach(img => {
    img.addEventListener('error', () => handleBroken(img));
    // por si el error ocurrió antes de que cargara este script
    if (img.complete && img.naturalWidth === 0) handleBroken(img);
  });

  /* ---------- 2. Título del hero letra por letra ---------- */
  let charIndex = 0;
  $$('[data-split]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    [...text].forEach(ch => {
      const span = document.createElement('span');
      span.className = 'char';
      span.style.setProperty('--i', charIndex++);
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
    });
  });

  /* ---------- 3. Navegación: fondo al hacer scroll, menú móvil, sección activa ---------- */
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const links = $('#navLinks');
  const progress = $('.scroll-progress');
  const toTop = $('#toTop');

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('is-scrolled', y > 40);
    toTop.classList.toggle('is-visible', y > 600);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    links.classList.remove('is-open');
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
    links.classList.toggle('is-open', !open);
  });
  $$('a', links).forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const navLinks = $$('.nav__links a[href^="#"]');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => sectionObserver.observe(s));

  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- 4. Carrusel de la galería ---------- */
  const gallery = $('.gallery-grid');
  const galleryCards = $$('.gallery-card', gallery);
  const galleryPrev = $('.gallery-control--prev');
  const galleryNext = $('.gallery-control--next');

  function updateGalleryControls() {
    const maxScroll = gallery.scrollWidth - gallery.clientWidth;
    galleryPrev.disabled = gallery.scrollLeft <= 3;
    galleryNext.disabled = gallery.scrollLeft >= maxScroll - 3;
  }
  function scrollGallery(direction) {
    const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
    const step = galleryCards[0].getBoundingClientRect().width + gap;
    gallery.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  galleryPrev.addEventListener('click', () => scrollGallery(-1));
  galleryNext.addEventListener('click', () => scrollGallery(1));
  gallery.addEventListener('scroll', updateGalleryControls, { passive: true });
  addEventListener('resize', updateGalleryControls);
  updateGalleryControls();

  /* ---------- 5. Aparición al hacer scroll (con escalonado) ---------- */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  $$('.reveal').forEach(el => {
    // escalonado entre hermanos (galería, lista de cuidados)
    const siblings = $$('.reveal', el.parentElement).filter(n => n.parentElement === el.parentElement);
    el.style.setProperty('--d', Math.max(0, siblings.indexOf(el)) * 110 + 'ms');
    revealObserver.observe(el);
  });

  /* ---------- 6. Contador de años ---------- */
  const counter = $('[data-count]');
  if (counter && !reduceMotion) {
    const target = +counter.dataset.count;
    counter.textContent = '0';
    new IntersectionObserver(([entry], obs) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now(), dur = 1400;
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        counter.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }, { threshold: 0.6 }).observe(counter);
  }

  /* ---------- 7. Logo que sigue el cursor (efecto 3D sutil) ---------- */
  const tiltBox = $('#logoTilt');
  const logo = $('.hero__logo', tiltBox);
  if (tiltBox && logo && !reduceMotion && matchMedia('(hover: hover)').matches) {
    const hero = $('#inicio');
    hero.addEventListener('pointermove', e => {
      const r = tiltBox.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      logo.style.transform = `rotateY(${x * 24}deg) rotateX(${-y * 24}deg) translate(${x * 14}px, ${y * 14}px)`;
    });
    hero.addEventListener('pointerleave', () => { logo.style.transform = ''; });
  }

  /* ---------- 8. Galería: visor de imágenes ---------- */
  const box = $('#lightbox');
  const boxImg = $('.lightbox__img', box);
  const shots = $$('.gallery-card__btn img').filter(i => !i.hidden);
  let current = 0;

  function show(i) {
    current = (i + shots.length) % shots.length;
    boxImg.src = shots[current].currentSrc || shots[current].src;
    boxImg.alt = shots[current].alt;
    boxImg.style.animation = 'none'; void boxImg.offsetWidth; boxImg.style.animation = '';
  }
  function open(i) { show(i); if (!box.open) box.showModal(); }

  $$('.gallery-card__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const img = $('img', btn);
      if (img.hidden) return; // no hay imagen real
      open(shots.indexOf(img));
    });
  });
  $('.lightbox__close', box).addEventListener('click', () => box.close());
  $('.lightbox__nav--prev', box).addEventListener('click', () => show(current - 1));
  $('.lightbox__nav--next', box).addEventListener('click', () => show(current + 1));
  box.addEventListener('click', e => { if (e.target === box) box.close(); });
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();