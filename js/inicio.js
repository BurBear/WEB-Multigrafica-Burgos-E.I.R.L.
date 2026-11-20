/* Local progressive enhancements for Inicio. No animation library or build step. */
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page !== 'inicio') return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  const ghosts = new Set();
  let photoObserver;
  let detailsObserver;
  let sectorsObserver;

  function animate(element, frames, options = {}) {
    if (!element || motion.matches || !element.animate) return null;
    try {
      const animation = element.animate(frames, {
        duration: 600, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards', ...options
      });
      running.add(animation);
      animation.finished.then(() => running.delete(animation), () => running.delete(animation));
      return animation;
    } catch { return null; } // No CSS-hidden state is required for any reveal.
  }

  function clearGhosts() {
    ghosts.forEach(image => image.remove());
    ghosts.clear();
  }

  function measureHeader() {
    const header = document.getElementById('navbar');
    if (!header) return;
    const update = () => {
      document.body.style.setProperty('--home-header-height', `${header.getBoundingClientRect().height}px`);
    };
    update();
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(header);
    else window.addEventListener('resize', update, { passive: true });
  }

  function enterHero() {
    if (motion.matches || document.hidden) return;
    const hero = document.getElementById('inicio');
    if (!hero) return;
    hero.querySelectorAll('[data-hero-line]').forEach((line, index) => {
      animate(line, [{ opacity: .15, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
        { duration: 650, delay: index * 90 });
    });
    animate(hero.querySelector('.hero-description'),
      [{ opacity: .2, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { delay: 240 });
    hero.querySelectorAll('.hero-actions a').forEach((button, index) => {
      animate(button, [{ opacity: .2, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, delay: 340 + index * 90 });
    });
    animate(hero.querySelector('.hero-scroll'),
      [{ opacity: .3, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 520 });
    animate(hero.querySelector('.home-hero-wash'), [{ opacity: 1 }, { opacity: 0 }], { duration: 950 });
  }

  function initProcess() {
    const root = document.querySelector('[data-home-process]');
    if (!root) return;
    const controls = root.querySelector('[data-process-controls]');
    const tabs = [...root.querySelectorAll('[data-process-tab]')];
    const panels = [...root.querySelectorAll('[data-process-panel]')];
    if (!controls || tabs.length !== 3 || panels.length !== 3) return;
    let displayed = 0;
    let revision = 0;
    const readyImages = new Map();
    const transitions = new Set();

    function prepare(index) {
      if (readyImages.has(index)) return readyImages.get(index);
      const image = panels[index].querySelector('figure > img');
      if (!image) return Promise.resolve(false);
      image.loading = 'eager';
      const ready = (async () => {
        try {
          if (image.decode) await image.decode();
          else if (!image.complete) await new Promise((resolve, reject) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', reject, { once: true });
          });
          return image.naturalWidth > 0;
        } catch { return false; }
      })();
      readyImages.set(index, ready);
      ready.then(success => { if (!success) readyImages.delete(index); });
      return ready;
    }

    function select(index) {
      tabs.forEach((tab, position) => {
        tab.setAttribute('aria-selected', String(position === index));
        tab.tabIndex = position === index ? 0 : -1;
      });
    }

    function transition(element, frames, options) {
      const animation = animate(element, frames, options);
      if (animation) {
        transitions.add(animation);
        animation.finished.then(() => transitions.delete(animation), () => transitions.delete(animation));
      }
      return animation;
    }

    function show(index, moveFocus = false) {
      const token = ++revision;
      // Keep the selected tab paired with the displayed panel until decoding succeeds.
      // Roving focus can still move immediately while the photograph is loading.
      tabs.forEach((tab, position) => { tab.tabIndex = position === index ? 0 : -1; });
      if (moveFocus) tabs[index].focus({ preventScroll: true });
      if (index === displayed) {
        root.setAttribute('aria-busy', 'false');
        select(displayed);
        return;
      }
      root.setAttribute('aria-busy', 'true');
      prepare(index).then(success => {
        if (token !== revision) return;
        root.setAttribute('aria-busy', 'false');
        if (!success) { select(displayed); return; }
        transitions.forEach(animation => animation.cancel());
        transitions.clear();
        clearGhosts();
        const previous = panels[displayed].querySelector('figure > img');
        const panel = panels[index];
        const image = panel.querySelector('figure > img');
        let ghost;
        if (!motion.matches && previous?.complete && previous.naturalWidth) {
          ghost = previous.cloneNode();
          ghost.className = 'home-process-ghost';
          ghost.alt = '';
          ghost.removeAttribute('id');
          ghost.setAttribute('aria-hidden', 'true');
          panel.querySelector('figure').append(ghost);
          ghosts.add(ghost);
        }
        // Atomic panel swap: every frame keeps its fixed 4:3 ratio.
        panels.forEach((item, position) => { item.hidden = position !== index; });
        displayed = index;
        select(index);
        const fade = transition(ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: 440 });
        const remove = () => { ghost?.remove(); ghosts.delete(ghost); };
        if (fade) fade.finished.then(remove, remove);
        else remove();
        transition(image, [{ transform: 'scale(1.025)' }, { transform: 'none' }], { duration: 650 });
      });
    }

    try {
      controls.setAttribute('role', 'tablist');
      controls.setAttribute('aria-orientation', 'vertical');
      tabs.forEach((tab, index) => {
        tab.setAttribute('role', 'tab');
        panels[index].setAttribute('role', 'tabpanel');
        panels[index].setAttribute('aria-labelledby', tab.id);
        panels[index].tabIndex = 0;
        tab.addEventListener('click', () => show(index));
        tab.addEventListener('keydown', event => {
          let next;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
          else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;
          else return;
          event.preventDefault();
          show(next, true);
        });
      });
      panels.forEach((panel, index) => { panel.hidden = index !== 0; });
      select(0);
      controls.hidden = false;
      // Only warm these three resources when this section approaches the viewport.
      if ('IntersectionObserver' in window) {
        const preload = new IntersectionObserver(entries => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          preload.disconnect();
          panels.forEach((_, index) => { prepare(index); });
        }, { rootMargin: '400px 0px', threshold: 0 });
        preload.observe(root);
      } else {
        controls.addEventListener('pointerenter', () => panels.forEach((_, index) => { prepare(index); }), { once: true });
        controls.addEventListener('focusin', () => panels.forEach((_, index) => { prepare(index); }), { once: true });
      }
    } catch {
      controls.hidden = true;
      panels.forEach(panel => {
        panel.hidden = false;
        panel.removeAttribute('role');
        panel.removeAttribute('tabindex');
        const heading = panel.querySelector('h3');
        if (heading) panel.setAttribute('aria-labelledby', heading.id);
      });
      clearGhosts();
    }
  }

  function revealPhotos() {
    if (motion.matches || !('IntersectionObserver' in window)) return;
    photoObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        photoObserver.unobserve(entry.target);
        const delay = Number(entry.target.dataset.homePhoto || 0) * 70;
        animate(entry.target, [{ opacity: .45, clipPath: 'inset(0 0 10% 0)' }, { opacity: 1, clipPath: 'inset(0)' }],
          { duration: 760, delay });
        animate(entry.target.parentElement.querySelector('.home-feature-caption'),
          [{ opacity: .4, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: delay + 100 });
      });
    }, { threshold: .12 });
    document.querySelectorAll('[data-home-photo]').forEach((photo, index) => {
      photo.dataset.homePhoto = String(index);
      photoObserver.observe(photo);
    });
  }

  function revealDetails() {
    if (motion.matches || !('IntersectionObserver' in window)) return;
    const root = document.querySelector('[data-home-details]');
    if (!root) return;
    const frames = [...root.querySelectorAll('[data-detail-media]')];
    detailsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        detailsObserver.unobserve(entry.target);
        if (entry.target.hasAttribute('data-detail-heading')) {
          animate(entry.target, [
            { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(18px)' },
            { clipPath: 'inset(0)', transform: 'none' }
          ], { duration: 850 });
          return;
        }
        const delay = Math.max(0, frames.indexOf(entry.target)) * 80;
        animate(entry.target, [
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0)' }
        ], { duration: 800, delay });
        animate(entry.target.querySelector('.home-detail-visual'), [
          { transform: 'scale(1.025)' }, { transform: 'none' }
        ], { duration: 850, delay });
        animate(entry.target.parentElement.querySelector('figcaption'), [
          { opacity: .4, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }
        ], { duration: 500, delay: delay + 120 });
      });
    }, { threshold: .14 });
    const heading = root.querySelector('[data-detail-heading]');
    if (heading) detailsObserver.observe(heading);
    frames.forEach(frame => detailsObserver.observe(frame));
  }

  function revealSectors() {
    if (motion.matches || !('IntersectionObserver' in window)) return;
    const root = document.querySelector('[data-home-sectors]');
    if (!root) return;
    const items = [...root.querySelectorAll('.sector-item')];
    sectorsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sectorsObserver.unobserve(entry.target);
        // Three pairs, with only a brief stagger inside each pair.
        const index = items.indexOf(entry.target);
        const delay = Math.floor(index / 2) * 60 + (index % 2) * 70;
        animate(entry.target, [{ opacity: .35, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay });
        animate(entry.target.querySelector('.home-sector-rule'),
          [{ transform: 'scaleX(.05)' }, { transform: 'scaleX(1)' }], { duration: 680, delay });
      });
    }, { threshold: .12 });
    items.forEach(item => sectorsObserver.observe(item));
  }

  const stopMotion = () => {
    photoObserver?.disconnect();
    detailsObserver?.disconnect();
    sectorsObserver?.disconnect();
    running.forEach(animation => animation.cancel());
    running.clear();
    clearGhosts();
  };
  motion.addEventListener('change', () => { if (motion.matches) stopMotion(); });
  window.addEventListener('pageshow', event => { if (event.persisted) stopMotion(); });
  [measureHeader, enterHero, initProcess, revealPhotos, revealDetails, revealSectors].forEach(initialize => {
    try { initialize(); } catch { /* Base HTML remains readable if an enhancement fails. */ }
  });
});
