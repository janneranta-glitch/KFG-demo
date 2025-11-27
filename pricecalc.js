window.calcPrice = function(){
  let tuote=document.getElementById('productSelect').value,
      pintak=document.getElementById('kaideFinish').value,
      handFinish=document.getElementById('handrailFinish').value,
      install=document.getElementById('installOption').value,
      stair=document.getElementById('isStair').value;
  let aiKaide=window.aiLines.filter(l=>l.type==="kaide").reduce((a,l)=>a+l.length,0),
      aiKj=window.aiLines.filter(l=>l.type==="käsijohde").reduce((a,l)=>a+l.length,0);
  let manKaide=window.manualMeasures.filter(m=>m.type==="kaide").reduce((a,m)=>a+m.length,0),
      manKj=window.manualMeasures.filter(m=>m.type==="käsijohde").reduce((a,m)=>a+m.length,0);
  let stairK = stair==="kyllä"?window.KAIDE_CONFIG.hinnat[tuote].nousuker:1;
  let totalKaide = (aiKaide + manKaide)*stairK;
  let totalKj = (aiKj + manKj)*stairK;
  let priceKaide = window.KAIDE_CONFIG.hinnat[tuote].sisä;
  let priceHand = window.KAIDE_CONFIG.hinnat.käsijohde[handFinish];
  let installCost = install==="kyllä"?totalKaide*window.KAIDE_CONFIG.asennus[tuote]:0;
  let hinta = totalKaide*priceKaide + totalKj*priceHand + installCost;
  document.getElementById('pricebox').innerHTML =
    `<b>Kaiteet yhteensä:</b> ${totalKaide.toFixed(2)} m<br>
    <b>Käsijohteet yhteensä:</b> ${totalKj.toFixed(2)} m<br>
    <b>Kokonaishinta:</b> <span style="color:#005936;font-weight:700">${hinta.toFixed(2)} € + alv 25.5</span>`;
  return hinta;
};
