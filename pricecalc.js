export function laskeHinta(aiLines, manualMeasures, tuote, pintak, handFinish, install, stair){
  // Hinnat, kertoimet, vinojen osuuksien korjaus
  let aiKaide=aiLines.filter(l=>l.type==="kaide").reduce((sum,l)=>sum+l.length,0);
  let aiKj=aiLines.filter(l=>l.type==="käsijohde").reduce((sum,l)=>sum+l.length,0);
  let manKaide=manualMeasures.filter(m=>m.type==="kaide").reduce((sum,m)=>sum+m.length,0);
  let manKj=manualMeasures.filter(m=>m.type==="käsijohde").reduce((sum,m)=>sum+m.length,0);

  let stairK = stair==="kyllä"?1.2:1;
  let totalKaide = (aiKaide + manKaide)*stairK;
  let totalKj = (aiKj + manKj)*stairK;
  let priceKaide = tuote==="pinnakaide"?230:350;
  let priceHand = handFinish==="maalaus"?8:9;
  let installCost = install==="kyllä"?totalKaide*45:0;
  let hinta = totalKaide*priceKaide + totalKj*priceHand + installCost;
  document.getElementById('pricebox').innerHTML =
    `<b>Kaiteet yhteensä:</b> ${totalKaide.toFixed(2)} m<br>
    <b>Käsijohteet yhteensä:</b> ${totalKj.toFixed(2)} m<br>
    <b>Kokonaishinta:</b> <span style="color:#005936;font-weight:700">${hinta.toFixed(2)} € + alv 0</span>`;
  return hinta;
}
