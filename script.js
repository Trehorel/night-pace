
(() => {
  "use strict";

  const reduce = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const hasIO = "IntersectionObserver" in window;

  document.documentElement.classList.add("js");

  /* =====================================
     STATISTIQUES LOCALES DE DÉMONSTRATION
     Ces chiffres ne sont pas partagés.
  ===================================== */

  const CLE = "nightpace-stats";

  const lireStats = () => {
    try {
      const s = JSON.parse(localStorage.getItem(CLE)) || {};

      return {
        coureurs: Math.max(0, Number(s.coureurs) || 0),
        km: Math.max(0, Number(s.km) || 0)
      };
    } catch {
      return { coureurs: 0, km: 0 };
    }
  };

  const ecrireStats = stats => {
    try {
      localStorage.setItem(CLE, JSON.stringify(stats));
    } catch {
      // Le stockage peut être indisponible.
    }
  };

  const stats = lireStats();

  document.querySelectorAll("[data-stat]").forEach(el => {
    const valeur = stats[el.dataset.stat];

    if (valeur !== undefined) {
      el.dataset.count = String(valeur);
    }
  });

  /* =====================================
     ANIMATIONS DES SECTIONS
  ===================================== */

  document
    .querySelectorAll("main > section:not(.hero)")
    .forEach(section => section.classList.add("sec"));

  document.querySelectorAll(".sec h2").forEach(h2 => {
    h2.classList.remove("reveal");

    // Évite d'englober plusieurs fois un titre.
    if (!h2.querySelector(".mot")) {
      const contenu = document.createElement("span");
      const texte = document.createElement("span");

      contenu.className = "mot";
      texte.textContent = h2.textContent.trim();

      contenu.appendChild(texte);
      h2.replaceChildren(contenu);
    }
  });

  const sections = document.querySelectorAll(".sec");

  if (reduce || !hasIO) {
    sections.forEach(section => section.classList.add("in"));
  } else {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("in");
        sectionObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px"
    });

    sections.forEach(section => {
      sectionObserver.observe(section);
    });
  }

  /* =====================================
     HEADER COMPACT AU DÉFILEMENT
  ===================================== */

  const header = document.querySelector(".site-header");
  let ticking = false;

  const onScroll = () => {
    if (!header || ticking) return;

    ticking = true;

    requestAnimationFrame(() => {
      header.classList.toggle("compact", window.scrollY > 40);
      ticking = false;
    });
  };

  if (header) {
    window.addEventListener("scroll", onScroll, {
      passive: true
    });

    onScroll();
  }

  /* =====================================
     APPARITION DES ÉLÉMENTS
  ===================================== */

  const reveals = document.querySelectorAll(".reveal");

  if (reduce || !hasIO) {
    reveals.forEach(el => el.classList.add("in"));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px"
    });

    reveals.forEach((el, index) => {
      el.style.setProperty("--d", `${(index % 4) * 80}ms`);
      revealObserver.observe(el);
    });
  }

  /* =====================================
     COMPTEURS ANIMÉS
  ===================================== */

  const fmt = new Intl.NumberFormat("fr-FR");

  const setVal = (el, valeur) => {
    const suffix = el.dataset.suffix || "";

    el.textContent =
      fmt.format(Math.round(valeur)) + suffix;
  };

  const counters = document.querySelectorAll("[data-count]");

  if (reduce || !hasIO) {
    counters.forEach(el => {
      const end = Number(el.dataset.count);

      if (Number.isFinite(end)) setVal(el, end);
    });
  } else {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        counterObserver.unobserve(entry.target);

        const el = entry.target;
        const end = Number(el.dataset.count);

        if (!Number.isFinite(end)) return;

        const duration = 1600;
        const start = performance.now();

        const step = now => {
          const progress = Math.min(
            (now - start) / duration,
            1
          );

          const eased = 1 - Math.pow(1 - progress, 4);

          setVal(el, end * eased);

          if (progress < 1) {
            requestAnimationFrame(step);
          }
        };

        requestAnimationFrame(step);
      });
    }, {
      threshold: 0.6
    });

    counters.forEach(el => {
      const end = Number(el.dataset.count);

      if (!Number.isFinite(end)) return;

      setVal(el, 0);
      counterObserver.observe(el);
    });
  }

  /* =====================================
     EFFET MAGNÉTIQUE DES BOUTONS
  ===================================== */

  const sourisDisponible = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  if (!reduce && sourisDisponible) {
    document.querySelectorAll(".magnet").forEach(btn => {
      let raf = 0;

      btn.addEventListener("pointermove", event => {
        const rect = btn.getBoundingClientRect();

        const x =
          (event.clientX - rect.left - rect.width / 2) * 0.2;

        const y =
          (event.clientY - rect.top - rect.height / 2) * 0.25;

        cancelAnimationFrame(raf);

        raf = requestAnimationFrame(() => {
          btn.style.transform =
            `translate3d(${x}px, ${y}px, 0)`;
        });
      });

      const reset = () => {
        cancelAnimationFrame(raf);
        btn.style.transform = "";
      };

      btn.addEventListener("pointerleave", reset);
      btn.addEventListener("blur", reset);
    });
  }

  /* =====================================
     FORMULAIRE DE DÉMONSTRATION
     Aucun compte réel n'est créé.
  ===================================== */

  const form = document.querySelector("#inscription");

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();

      const prenom = form.elements.namedItem("prenom");
      const km = form.elements.namedItem("km");
      const message = document.querySelector(".ok");

      if (!prenom || !message) {
        console.error(
          "Vérifie les champs du formulaire et la zone .ok."
        );
        return;
      }

      const nom = prenom.value.trim();

      if (!nom) {
        prenom.focus();
        return;
      }

      const distance = km ? Number(km.value) || 0 : 0;

      // Mise à jour locale, uniquement pour la démonstration.
      const nouvellesStats = lireStats();

      nouvellesStats.coureurs += 1;
      nouvellesStats.km = Math.round(
        (nouvellesStats.km + Math.max(0, distance)) * 10
      ) / 10;

      ecrireStats(nouvellesStats);

      // Indique clairement que rien n'a été envoyé à un serveur.
      message.textContent =
        `Bonjour ${nom} ! Le formulaire est en mode démonstration. ` +
        "Aucun compte réel n'a été créé et aucune donnée " +
        "n'a été envoyée à un serveur.";

      message.classList.add("show");
      message.setAttribute("role", "status");
      message.setAttribute("aria-live", "polite");

      form.reset();

      message.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center"
      });
    });
  }
})();
