const canvasArea = document.getElementById('canvasArea');
let pdfFiles = [], imgFiles = [], pageState = { index: 0, zoom: 1.0 };
let analysisResults = []; // [{type: 'pdf'|'img', canvas, aiData: {lines}, measures: [{x1,y1,x2,y2,mitat}] }]
let currentData = null;

document.getElementById('fileinput').onchange = async function(e){
  pdfFiles = []; imgFiles = []; analysisResults = []; pageState.index=0;
  for(const f of e.target.files){
    if(f.type==="application/pdf") pdfFiles.push(f);
    else imgFiles.push(f);
  }
  await loadPage(0);
};

document.getElementById('prevPage').onclick =()=>{ loadPage(pageState.index-1); }
document.getElementById('nextPage').onclick =()=>{ loadPage(pageState.index+1); }
document.getElementById('zoomIn').onclick =()=>{ pageState.zoom+=0.2; redrawCurrent(); }
document.getElementById('zoomOut').onclick =()=>{ pageState.zoom=Math.max(0.2,pageState.zoom-0.2); redrawCurrent(); }

async function loadPage(idx){
  const total = pdfFiles.length + imgFiles.length;
  if(idx<0 || idx>=total) return;
  pageState.index = idx;
  document.getElementById('pageLabel').textContent = `${idx+1}/${total}`;
  canvasArea.innerHTML = "";
  let f = idx < pdfFiles.length ? pdfFiles[idx] : imgFiles[idx-pdfFiles.length];
  let c = document.createElement('canvas');
  c.width=800; c.height=440;
  canvasArea.appendChild(c);
  let ctx = c.getContext('2d');

  if(f.type==="application/pdf"){
    let fr = new FileReader();
    fr.onload = async function(evt){
      let pdf = await pdfjsLib.getDocument(new Uint8Array(evt.target.result)).promise;
      let page = await pdf.getPage(1); // aina eka sivu: laajenna page-num-logiikkaan jos haluat useamman!
      let vp = page.getViewport({scale:pageState.zoom});
      c.width = vp.width; c.height = vp.height;
      await page.render({canvasContext:ctx, viewport: vp}).promise;
      afterImageLoaded(c);
    };
    fr.readAsArrayBuffer(f);
  }else{
    let fr = new FileReader();
    fr.onload = function(e2){
      let img = new Image();
      img.onload = function(){
        c.width=img.width*pageState.zoom; c.height=img.height*pageState.zoom;
        ctx.drawImage(img,0,0,img.width*pageState.zoom,img.height*pageState.zoom);
        afterImageLoaded(c);
      }
      img.src = e2.target.result;
    }
    fr.readAsDataURL(f);
  }
}

function afterImageLoaded(canvas){
  // AI/REST analyysi
  document.getElementById('measurements').innerHTML="";
  fetch('https://OMA-BACKENDI/analyze-pdf',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({image:canvas.toDataURL()})
  }).then(r=>r.json()).then(ai=>{
    // ai: {lines:[{x1,y1,x2,y2,type}]}
    currentData = {canvas, aiData: ai, measures: []};
    analysisResults[pageState.index]=currentData;
    drawAiOverlay(canvas, ai.lines||[]);
    initMeasureInput(canvas, ai.lines||[]);
    calcPriceAndShow();
  }).catch(_=>{ /* AI-backendi voi puuttua dev-ympäristössä */ });
}

// NUOLIPAINIKKEET tuovat seuraavan/takana PDF-sivun tai kuvan
function redrawCurrent(){
  if(!currentData) return;
  let ctx = currentData.canvas.getContext('2d');
  ctx.clearRect(0,0,currentData.canvas.width,currentData.canvas.height);
  // Piirretään uusin sivu/skaala: haettava uudestaan mahdollisesti (laajenna 'loadPage' kutsuu afterImageLoaded)
  // Tässä voi olla optimointia, jos haluat säilyttää origin-kuvan
  // ... (tai tee reload: loadPage(pageState.index);)
}

// AI-tulosten piirto PDF/canvasin päälle
function drawAiOverlay(canvas, lines){
  const ctx = canvas.getContext('2d');
  lines.forEach(line=>{
    ctx.beginPath();
    ctx.moveTo(line.x1,line.y1); ctx.lineTo(line.x2,line.y2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = (line.type=="kaide"?"blue":"red");
    ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
    let dist = Math.sqrt(Math.pow(line.x2-line.x1,2)+Math.pow(line.y2-line.y1,2))/70; // skaalaus
    ctx.font="15px Arial"; ctx.fillStyle="#333";
    ctx.fillText(dist.toFixed(2)+'m',(line.x1+line.x2)/2,(line.y1+line.y2)/2-8);
  });
}

// Mittauspisteiden/viivojen käyttäjäsyötteet, editointi, poisto
function initMeasureInput(canvas, lines){
  const mDiv = document.getElementById('measurements');
  mDiv.innerHTML = "";
  lines.forEach((line,i)=>{
    let s = document.createElement('span');
    s.className = 'measure-label';
    s.style.color = (line.type=="kaide"?"blue":"red");
    let dist = Math.sqrt(Math.pow(line.x2-line.x1,2)+Math.pow(line.y2-line.y1,2))/70;
    s.innerHTML = `${line.type} <input type="number" value="${dist.toFixed(2)}" step="0.01" class="measure-edit"> m
      <button class="measure-edit" onclick="removeMeasure(${pageState.index},${i})">Poista</button>`;
    mDiv.appendChild(s);
    mDiv.appendChild(document.createElement("br"));
  });
}

// Mittalinjan poisto
window.removeMeasure = function(idx, i){
  (analysisResults[idx].aiData.lines || []).splice(i,1);
  drawAiOverlay(analysisResults[idx].canvas,analysisResults[idx].aiData.lines||[]);
  initMeasureInput(analysisResults[idx].canvas,analysisResults[idx].aiData.lines||[]);
  calcPriceAndShow();
}

// Koko UI: Kaideominaisuudet, materiaalit, toimitusvalinnat
document.getElementById('configSection').innerHTML = `
  <div class="config-row">
    <label>Kaiteen malli:</label>
    <select id="kaidetype"><option value="pinnakaide">Pinnakaide</option><option value="lattakaide">Lattakaide</option></select>
    <label>Käyttökohde:</label>
    <select id="kaideuse"><option value="sisä">Sisälle</option><option value="ulkona">Ulos</option></select>
    <label>Kaiteen väri:</label>
    <select id="kaidecolor"><option value="RAL9005">Musta</option><option value="RAL9010">Valkoinen</option><option value="RAL7024">T.harmaa</option><option value="RAL7040">V.harmaa</option></select>
  </div>
  <div class="config-row">
    <label>Käsijohteen materiaali:</label>
    <select id="handrailmat"><option value="mustateräs">Mustateräs</option><option value="rst">RST</option></select>
    <label>Käsijohteen väri:</label>
    <select id="handrailcolor"><option value="RAL9005">Musta</option><option value="RAL9010">Valkoinen</option><option value="RAL7024">T.harmaa</option><option value="RAL7040">V.harmaa</option></select>
    <label>Ulos?</label>
    <select id="handrailout"><option value="ei">Ei</option><option value="kyllä">Kyllä</option></select>
  </div>
  <div class="config-row">
    <label>Toimitus:</label>
    <select id="deliverytype"><option value="asennus">Asennus</option><option value="toimitus">Toimitus työmaalle (pk)</option><option value="noudan">Noudan itse</option></select>
    <label>Etäisyys (km, Lammaskallionkatu 8):</label>
    <input type="number" id="deliverykm" value="10" min="0" style="width:65px;">
  </div>
`;

// Hinnanlaskenta
function calcPriceAndShow(){
  // Laske mitat, kerro materiaalivalinnoilla ja hinnoilla (voit laajentaa config.js:lla)
  let kaidetyyppi=document.getElementById('kaidetype').value;
  let kaytto=document.getElementById('kaideuse').value;
  let handmat=document.getElementById('handrailmat').value;
  let asennus=document.getElementById('deliverytype').value;
  let km=parseFloat(document.getElementById('deliverykm').value)||0;
  let yht=0, txt="";
  analysisResults.forEach(ad=>{
    (ad.aiData.lines||[]).forEach(line=>{
      let pituus = Math.sqrt(Math.pow(line.x2-line.x1,2)+Math.pow(line.y2-line.y1,2))/70;
      let hinta = (line.type=="kaide"
        ? (kaidetyyppi=="pinnakaide"? (kaytto=="sisä"?230:290) : (kaytto=="sisä"?350:440))
        : (handmat=="mustateräs"?5:9));
      yht += pituus * hinta;
      txt += `<span style="color:${line.type=="kaide"?"blue":"red"}">${line.type}</span>: ${pituus.toFixed(2)} m x ${hinta} €/m = ${ (pituus*hinta).toFixed(2) }<br>`;
    });
  });
  // Lisää asennus / toimitus
  let as_kaide = asennus=="asennus"
    ? (kaidetyyppi=="pinnakaide"?45:65)*yht/ (kaidetyyppi=="pinnakaide"?230:350)
    : 0;
  let as_handrail = asennus=="asennus" ? 40 * yht/(handmat=="mustateräs"?5:9) : 0;
  let toimitus = asennus=="asennus"?80+2.8*km : asennus=="toimitus"?90+3.5*km : 0;
  txt += `<b>Asennus:</b> ${ (as_kaide+as_handrail).toFixed(2) } €<br><b>Toimitus:</b> ${toimitus.toFixed(2)} €<br>`;
  let kokoyht = yht+as_kaide+as_handrail+toimitus;
  document.getElementById("pricebox").innerHTML = `<div class="pricebox">${txt}<br><b>Yhteensä: ${kokoyht.toFixed(2)} € + alv 0</b></div>`;
}
['kaidetype','kaideuse','handrailmat','deliverytype','deliverykm'].forEach(id=>{
  document.getElementById(id).onchange=calcPriceAndShow;
});

// 3D-preview (monipuolista halutessa threeview.js:llä)
document.getElementById("preview-3d").onclick=function(){
  let canvas=document.getElementById("three-canvas");
  let renderer = new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setClearColor(0xe6e9ef);
  let scene = new THREE.Scene();
  let camera = new THREE.PerspectiveCamera(45,700/350,0.1,1000);
  camera.position.set(2,1.2,5);
  let light = new THREE.AmbientLight(0xffffff,1.2); scene.add(light);

  analysisResults.forEach(ad=>{
    (ad.aiData.lines||[]).forEach(line=>{
      let length = Math.sqrt(Math.pow(line.x2-line.x1,2)+Math.pow(line.y2-line.y1,2))/150;
      let geo = new THREE.BoxGeometry(length,0.04,line.type=="kaide"?0.04:0.02);
      let mat = new THREE.MeshStandardMaterial({color:line.type=="kaide"?0x3333cc:0xff2233});
      let viiva = new THREE.Mesh(geo,mat);
      viiva.position.set(0,1.0,(line.type=="kaide"?0:0.4));
      scene.add(viiva);
    });
  });
  renderer.render(scene, camera);
};
