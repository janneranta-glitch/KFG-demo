window.CONFIG = {
  kaidehinnat: {
    pinnakaide: { sisä: 230, ulkona: 290 },
    lattakaide: { sisä: 350, ulkona: 440 }
  },
  handrail: {
    painting: 8,
    mustateräs: 5,
    rst: 9
  },
  install: {
    pinnakaide: 45,
    lattakaide: 65,
    handrail: 40
  },
  delivery: {
    install: { base: 80, perkm: 2.8 },
    site: { base: 90, perkm: 3.5 }
  },
  colors: [
    { value: "RAL9005", label: "Musta (RAL9005)" },
    { value: "RAL9010", label: "Valkoinen (RAL9010)" },
    { value: "RAL7024", label: "Tumman harmaa (RAL7024)" },
    { value: "RAL7040", label: "Vaalean harmaa (RAL7040)" }
  ],
  models: [
    { value: "pinnakaide", label: "Pinnakaide" },
    { value: "lattakaide", label: "Lattakaide" }
  ]
};
// --- muokkaa vain tätä tiedostoa kun hinnat/materiaalit muuttuvat! ---
window.initConfig = function() {
  const s = document.getElementById('config-section');
  s.innerHTML = `
  <div class="uirow">
    <label>Kaiteen tyyppi:</label>
    <select id="kaidetype">
      ${window.CONFIG.models.map(m=>`<option value="${m.value}">${m.label}</option>`).join('')}
    </select>
    <label>Käyttökohde:</label>
    <select id="kaideuse">
      <option value="sisä">Sisälle</option>
      <option value="ulkona">Ulos</option>
    </select>
    <label>Kaiteen väri:</label>
    <select id="kaidecolor">
      ${window.CONFIG.colors.map(c=>`<option value="${c.value}">${c.label}</option>`).join('')}
    </select>
  </div>
  <div class="uirow">
    <label>Käsijohteen materiaali:</label>
    <select id="handrailmat">
      <option value="mustateräs">Mustateräs</option>
      <option value="rst">Harjattu RST</option>
    </select>
    <label>Käsijohteen väri:</label>
    <select id="handrailcolor">
      ${window.CONFIG.colors.map(c=>`<option value="${c.value}">${c.label}</option>`).join('')}
    </select>
    <label>Ulos?</label>
    <select id="handrailout">
      <option value="ei">Ei</option>
      <option value="kyllä">Kyllä</option>
    </select>
  </div>
  <div class="uirow">
    <label>Toimitus:</label>
    <select id="deliverytype">
      <option value="asennus">Asennus</option>
      <option value="toimitus">Toimitus työmaalle (pk)</option>
      <option value="noudan">Noudan itse</option>
    </select>
    <label>Etäisyys (km, Lammaskallionkatu 8, Kerava):</label>
    <input type="number" id="deliverykm" value="10" min="0" style="width:65px;">
  </div>
  `;
};
