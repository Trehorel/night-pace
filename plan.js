(() => {
  const form = document.querySelector('#generateur');
  if (!form) return;
  const sortie = document.querySelector('#resultat');
  const erreur = document.querySelector('.erreur');
  const JOUR = 86400000;
  const NIVEAUX = ['debutant', 'inter', 'confirme'];

  // pic : sortie longue maximale (min) · dep : sortie longue de départ selon le niveau (min)
  // min : semaines conseillées · taper : semaines d'affûtage (course comprise) · cap : endurance max (min)
  const COURSES = {
    '5':   { nom: '5 km', pic: 60, dep: [25, 35, 45], min: 6, taper: 1, cap: 40,
      q: ['Fartlek : 6 × 1 min allure vive, 1 min 30 de trot', 'Intervalles : 6 × 3 min allure soutenue, récupération 2 min', '8 × 400 m allure 5 km, récupération 1 min 30'] },
    '10':  { nom: '10 km', pic: 75, dep: [30, 40, 55], min: 6, taper: 1, cap: 55,
      q: ['Fartlek : 8 × 1 min allure vive, 1 min 30 de trot', 'Intervalles : 6 × 3 min allure soutenue, récupération 2 min', '5 × 1 000 m allure 10 km, récupération 2 min'] },
    '21':  { nom: 'Semi-marathon', pic: 115, dep: [40, 55, 75], min: 8, taper: 2, cap: 70,
      q: ['Fartlek : 8 × 2 min allure vive, 2 min de trot', 'Tempo : 2 × 12 min à allure semi, récupération 3 min', '3 × 10 min à allure semi, récupération 3 min'] },
    '42':  { nom: 'Marathon', pic: 180, dep: [60, 80, 100], min: 12, taper: 3, cap: 90,
      q: ['Fartlek : 8 × 2 min allure vive, 2 min de trot', 'Tempo : 2 × 15 min à allure marathon, récupération 4 min', '2 × 20 min à allure marathon, récupération 4 min'] },
    't25': { nom: 'Trail 20-30 km', pic: 150, dep: [45, 60, 80], min: 8, taper: 2, cap: 75, trail: true, dplus: 1000,
      q: ['Côtes : 8 × 1 min en côte, descente en trottinant', 'Côtes : 6 × 3 min en côte soutenue, descente en trottinant', 'Côtes : 8 × 2 min en côte, descente en trottinant'] },
    't50': { nom: 'Trail 40-60 km', pic: 240, dep: [60, 90, 120], min: 12, taper: 2, cap: 100, trail: true, dplus: 2000,
      q: ['Côtes : 6 × 2 min en côte, descente en trottinant', 'Côtes : 6 × 3 min en côte soutenue, descente en trottinant', 'Côtes : 5 × 5 min en côte, marche active si besoin'] },
    'u100': { nom: 'Ultra-trail 80 km et plus', pic: 360, dep: [75, 120, 150], min: 16, taper: 3, cap: 120, trail: true, dplus: 3500,
      q: ['Côtes : 6 × 2 min en côte, descente en trottinant', 'Côtes : 5 × 6 min en côte, marche active dans les pentes', 'Côtes : 4 × 10 min en côte, marche active dans les pentes'] }
  };

  // E = endurance, Q = qualité, F = footing, L = sortie longue
  const ORDRE = {
    2: ['E', 'L'],
    3: ['E', 'Q', 'L'],
    4: ['E', 'Q', 'F', 'L'],
    5: ['E', 'Q', 'F', 'E', 'L'],
    6: ['E', 'Q', 'F', 'E', 'F', 'L']
  };
  const ETIQUETTES = { montee: 'Montée en charge', recup: 'Semaine allégée', affutage: 'Affûtage', course: 'Semaine de la course' };

  const r5 = m => Math.round(m / 5) * 5;
  const fmt = m => {
    const h = Math.floor(m / 60), r = m % 60;
    if (!h) return `${m} min`;
    return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
  };
  const court = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const complet = d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const decaler = (d, jours) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + jours);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const aujourdhui = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };

  form.date.min = iso(decaler(aujourdhui(), 14));

  form.addEventListener('submit', e => {
    e.preventDefault();
    erreur.textContent = '';
    sortie.innerHTML = '';

    const cle = form.course.value;
    const c = COURSES[cle];
    if (!c || !form.date.value) return;
    const niveau = form.niveau.value;
    const seances = +form.seances.value;
    const [a, m, j] = form.date.value.split('-').map(Number);
    const course = new Date(a, m - 1, j);
    const auj = aujourdhui();
    const jours = Math.round((course - auj) / JOUR);
    if (jours < 14) {
      erreur.textContent = 'Choisis une date de course située dans au moins 2 semaines.';
      return;
    }

    const total = Math.ceil(jours / 7);          // semaines jusqu'à la course
    const n = Math.min(total, 30);               // semaines affichées (30 maximum)
    const taper = Math.min(c.taper, n - 1);
    const B = n - taper;                         // semaines de montée, la dernière est le pic
    const L0 = Math.min(c.dep[NIVEAUX.indexOf(niveau)], c.pic);
    const pic = B === 1 ? L0 : c.pic;
    const reducs = { 1: [], 2: [0.7], 3: [0.8, 0.6] }[taper];
    const courte = c.pic <= 75 ? 25 : 30;
    const cartes = [];

    for (let i = 0; i < n; i++) {
      const debut = decaler(auj, (total - n + i) * 7);
      const fin = decaler(debut, 6);
      let type;
      if (i === n - 1) type = 'course';
      else if (i >= B) type = 'affutage';
      else type = ((i + 1) % 4 === 0 && i !== B - 1 && B >= 5) ? 'recup' : 'montee';

      let lignes;
      if (type === 'course') {
        const nb = Math.min(seances - 1, 2);
        lignes = Array.from({ length: nb }, () => ['Footing', `${fmt(courte)} à allure facile, avec 3 accélérations de 15 s`]);
        lignes.push(['Jour de course', `${c.nom}, le ${complet(course)}`]);
      } else {
        let L;
        if (type === 'affutage') {
          L = pic * reducs[i - B];
        } else {
          const base = B === 1 ? L0 : L0 + (c.pic - L0) * i / (B - 1);
          L = type === 'recup' ? base * 0.75 : base;
        }
        L = Math.max(20, r5(L));
        const E = Math.max(20, Math.min(c.cap, r5(L * 0.5)));
        const F = Math.max(20, r5(E * 0.7));
        const p = B === 1 ? 1 : Math.min(i, B - 1) / (B - 1);

        let q;
        if (type === 'recup') q = c.q[0];
        else if (type === 'affutage') q = c.trail ? 'Rappel : 4 × 1 min en côte, récupération en descente' : "Rappel d'allure : 4 × 2 min allure course, récupération 2 min";
        else if (niveau === 'debutant' && p < 0.34) q = c.trail ? 'Footing sur chemin vallonné, avec 4 côtes courtes de 30 s' : 'Footing facile avec 4 accélérations de 20 s';
        else q = c.q[p < 0.34 ? 0 : p < 0.67 ? 1 : 2];

        const dp = c.trail ? `, environ ${Math.round(c.dplus * L / c.pic / 50) * 50} m de D+` : '';
        const nut = c.pic >= 240 && L >= 180 ? ', en testant ta nutrition' : '';
        const BLOCS = {
          E: ['Endurance', `${fmt(E)} à allure facile${c.trail ? ', sur chemin' : ''}`],
          Q: ['Qualité', q],
          F: ['Footing', `${fmt(F)} très facile`],
          L: ['Sortie longue', `${fmt(L)}${dp}${nut}`]
        };
        lignes = ORDRE[seances].map(k => BLOCS[k]);
      }

      cartes.push(`<article class="carte semaine ${type}"><h3>Semaine ${i + 1}</h3><p class="dates">${court(debut)} – ${court(fin)}</p><span class="badge">${ETIQUETTES[type]}</span><ul>${lignes.map(([t, x]) => `<li><b>${t}</b> : ${x}</li>`).join('')}</ul></article>`);
    }

    const alertes = [];
    if (total > n) alertes.push(`Ta course est dans ${total} semaines : ton plan commence le ${court(decaler(auj, (total - n) * 7))}. D'ici là, cours 2 à 3 fois par semaine à allure facile.`);
    if (n < c.min) alertes.push(`Le délai est court pour cette distance (minimum conseillé : ${c.min} semaines). Le plan est condensé : reste prudent, écoute ton corps et n'hésite pas à viser une course plus tardive.`);
    if (niveau === 'debutant' && ['42', 't50', 'u100'].includes(cle)) alertes.push('Cette distance est ambitieuse pour un débutant : prévois plus de temps de préparation et demande un avis médical.');
    if (niveau === 'debutant' && ['5', '10'].includes(cle)) alertes.push('Si tu ne cours pas encore 20 minutes d\'affilée, commence par le programme « Premier 5 km » (alternance marche et course) sur la page <a href="programmes.html">Programmes</a>.');
    if (['42', 'u100'].includes(cle)) alertes.push('Un bilan médical est vivement recommandé avant de préparer cette distance.');

    sortie.innerHTML = `
      <h2>Ton plan</h2>
      <p class="resume">${c.nom}, ${n} semaines, ${seances} séances par semaine, jusqu'au ${complet(course)}. Sortie longue maximale : ${fmt(Math.max(20, r5(pic)))}, en semaine ${B}.</p>
      ${alertes.map(t => `<p class="alerte">${t}</p>`).join('')}
      <p>Chaque semaine commence à la date indiquée. Garde la sortie longue pour la fin de semaine et laisse au moins un jour de repos entre deux séances intenses. « Allure facile » veut dire que tu peux parler en courant. Ces durées sont des repères généraux, pas un avis médical : adapte-les à tes sensations et arrête-toi en cas de douleur.</p>
      <div class="grille">${cartes.join('')}</div>
      <div class="actions outils"><button class="btn ghost" type="button" id="imprimer">Imprimer ou enregistrer en PDF</button></div>`;

    sortie.querySelector('#imprimer').addEventListener('click', () => window.print());
    sortie.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
})();
