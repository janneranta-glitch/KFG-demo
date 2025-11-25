window.updatePrice = function() {
  let kaidetyyppi=document.getElementById('kaidetype').value;
  let kaytto=document.getElementById('kaideuse').value;
  let handmaterial=document.getElementById('handrailmat').value;
  let asennus=document.getElementById('deliverytype').value;
  let km=parseFloat(document.getElementById('deliverykm').value)||0;
  let kaide_m = sumlen(window.DrawState.points, window.DrawState.scale);
  let handrail_m = sumlen(window.DrawState.handrail, window.DrawState.scale);

  // Kaidehinta
  let kaide_hinta = window.CONFIG.kaidehinnat[kaidetyyppi][kaytto]*kaide_m;
  let handrail_paint = window.CONFIG.handrail.painting*handrail_m;
  let handrail_mat_hinta = (handmaterial=="mustateräs"?window.CONFIG.handrail.mustateräs:window.CONFIG.handrail.rst)*handrail_m;
  let handrail_cost = handrail_mat_hinta+handrail_paint;
  // Asennus-
  let as_kaide=0, as_handrail=0;
  if(asennus=="asennus"){
    as_kaide = window.CONFIG.install[kaidetyyppi]*kaide_m;
    as_handrail = window.CONFIG.install.handrail*handrail_m;
  }
  let toimitus = 0, toimitusteksti="";
  if(asennus=="asennus"){
    toimitus = window.CONFIG.delivery.install.base + window.CONFIG.delivery.install.perkm*km;
    toimitusteksti = `Asennuksen toimitus: ${window.CONFIG.delivery.install.base}€ + ${window.CONFIG.delivery.install.perkm}€/km (${km} km)`;
  }
  else if(asennus=="toimitus"){
    toimitus = window.CONFIG.delivery.site.base + window.CONFIG.delivery.site.perkm*km;
    toimitusteksti = `Työmaatoimitus: ${window.CONFIG.delivery.site.base}€ + ${window.CONFIG.delivery.site.perkm}€/km (${km} km)`;
  }
  else toimitusteksti = "Noudan itse";
  let yht = kaide_hinta+handrail_cost+as_kaide+as_handrail+toimitus;
  document.getElementById('price-section').innerHTML = `<div class="pricebox">
    <b>Arvioitu Hinta:</b><br>
    - Kaide: ${kaide_hinta.toFixed(2)} €<br>
    - Käsijohde (materiaali): ${handrail_mat_hinta.toFixed(2)} €<br>
    - Käsijohteen maalaus: ${handrail_paint.toFixed(2)} €<br>
    - Asennus: ${(as_kaide+as_handrail).toFixed(2)} €<br>
    - ${toimitusteksti}: ${toimitus.toFixed(2)} €<br>
    <b>Yhteensä: ${yht.toFixed(2)} € + alv 0</b></div>`;
};
["kaidetype","kaideuse","handrailmat","deliverytype","deliverykm"].forEach(id=>{
  document.addEventListener('input',e=>{
    if(e.target.id==id) window.updatePrice();
  });
});
window.DrawState.canvas && window.DrawState.canvas.addEventListener("mouseup", window.updatePrice);
