(() => {
  const form = document.querySelector('#allures');
  if (!form) return;
  const f = form.elements;
  const sortie = document.querySelector('#resultat');
  const erreur = document.querySelector('.erreur');
  const autre = document.querySelector('#autre');

  const DISTANCES = [['5 km', 5], ['10 km', 10], ['15 km', 15], ['Semi-marathon', 21.0975], ['Marathon', 42.195]];

  const deux = n => String(n).padStart(2, '0');
  const duree = sec => {
    const s = Math.round(sec);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return h ? `${h} h ${deux(m)} min ${deux(r)} s` : `${m} min ${deux(r)} s`;
  };
  const allureTxt = sec => { const s = Math.round(sec); return `${Math.floor(s / 60)}:${deux(s % 60)} /km`; };
  const nombre = x => x.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const kmTxt = k => k.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

  f.distance.addEventListener('change', () => {
    const perso = f.distance.value === 'autre';
    autre.hidden = !perso;
    f.km.required = perso;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    erreur.textContent = '';
    sortie.innerHTML = '';

    const perso = f.distance.value === 'autre';
    const dist = perso ? parseFloat(f.km.value) : parseFloat(f.distance.value);
    const t = (+f.h.value || 0) * 3600 + (+f.min.value || 0) * 60 + (+f.s.value || 0);

    if (!(dist >= 0.1 && dist <= 250)) { erreur.textContent = 'Indique une distance comprise entre 0,1 et 250 km.'; return; }
    if (!(t > 0)) { erreur.textContent = 'Indique ton temps (heures, minutes, secondes).'; return; }
    const allure = t / dist;                      // secondes par km
    if (allure < 120 || allure > 1200) { erreur.textContent = 'Ces valeurs semblent irréalistes : vérifie la distance et le temps.'; return; }
    const vitesse = dist / (t / 3600);            // km/h

    // Estimation sur d'autres distances (formule de Riegel, exposant 1,06)
    const estimations = DISTANCES.map(([nom, d]) => {
      const ref = Math.abs(d - dist) < 0.01;
      const t2 = ref ? t : t * Math.pow(d / dist, 1.06);
      return `<tr${ref ? ' class="ref"' : ''}><td>${nom}${ref ? ' (ta performance)' : ''}</td><td>${duree(t2)}</td><td>${allureTxt(t2 / d)}</td></tr>`;
    }).join('');

    // Tableau de passage à allure constante
    const pas = dist <= 12 ? 1 : 5;
    const passages = [];
    for (let k = pas; k < dist - 0.001; k += pas) {
      passages.push(`<tr><td>${kmTxt(k)} km</td><td>${duree(allure * k)}</td></tr>`);
    }
    passages.push(`<tr class="ref"><td>${kmTxt(dist)} km (arrivée)</td><td>${duree(t)}</td></tr>`);

    sortie.innerHTML = `
      <h2>Tes allures</h2>
      <div class="chiffres">
        <div><strong>${allureTxt(allure)}</strong><span>allure moyenne</span></div>
        <div><strong>${nombre(vitesse)} km/h</strong><span>vitesse moyenne</span></div>
      </div>

      <h3 class="sous">Temps estimés sur d'autres distances</h3>
      <div class="defile"><table class="tableau">
        <thead><tr><th>Distance</th><th>Temps estimé</th><th>Allure</th></tr></thead>
        <tbody>${estimations}</tbody>
      </table></div>
      <p>Ces estimations utilisent la formule de Riegel : temps × (distance visée ÷ distance de référence) puissance 1,06. Ce sont des ordres de grandeur, plus fiables entre le 5 km et le marathon pour un coureur entraîné à la distance visée. Elles ne tiennent pas compte du dénivelé : elles ne s'appliquent donc pas au trail.</p>

      <h3 class="sous">Temps de passage à allure constante</h3>
      <div class="defile"><table class="tableau">
        <thead><tr><th>Distance parcourue</th><th>Temps de passage</th></tr></thead>
        <tbody>${passages.join('')}</tbody>
      </table></div>`;

    sortie.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
})();
