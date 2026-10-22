(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  document.documentElement.classList.add('js');

  // Sections : trait néon + titre qui monte depuis un masque
  document.querySelectorAll('main > section:not(.hero)').forEach(s => s.classList.add('sec'));
  document.querySelectorAll('.sec h2').forEach(h => {
    h.classList.remove('reveal');
    h.innerHTML = '<span class="mot"><span>' + h.innerHTML + '</span></span>';
  });
  const secs = document.querySelectorAll('.sec');
  if (reduce || !hasIO) {
    secs.forEach(s => s.classList.add('in'));
  } else {
    const so = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); so.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    secs.forEach(s => so.observe(s));
  }

  // Header qui se compacte (scroll passif + une seule mise à jour par frame)
  const header = document.querySelector('.site-header');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('compact', window.scrollY > 40);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Apparition au scroll : fade + translation
  const reveals = document.querySelectorAll('.reveal');
  if (reduce || !hasIO) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el, i) => { el.style.setProperty('--d', (i % 4) * 80 + 'ms'); io.observe(el); });
  }

  // Chiffres qui défilent quand ils apparaissent
  const fmt = new Intl.NumberFormat('fr-FR');
  const setVal = (el, v) => { el.textContent = fmt.format(Math.round(v)) + (el.dataset.suffix || ''); };
  const counters = document.querySelectorAll('[data-count]');
  if (reduce || !hasIO) {
    counters.forEach(el => setVal(el, +el.dataset.count));
  } else {
    const co = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        const el = e.target, end = +el.dataset.count, dur = 1600, t0 = performance.now();
        const step = t => {
          const p = Math.min((t - t0) / dur, 1);
          setVal(el, end * (1 - Math.pow(1 - p, 4))); // ease-out
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => { setVal(el, 0); co.observe(el); });
  }

  // Effet magnétique sur les boutons (souris uniquement)
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.magnet').forEach(btn => {
      let raf;
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.4;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { btn.style.transform = `translate3d(${x}px,${y}px,0)`; });
      });
      btn.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); btn.style.transform = ''; });
    });
  }
})();
