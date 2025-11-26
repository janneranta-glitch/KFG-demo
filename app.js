const canvasArea = document.getElementById('canvasArea');
let pdfFiles = [], imgFiles = [], pageState = { index: 0, zoom: 1.0, offsetX: 0, offsetY: 0 };
let analysisResults = []; // [{...}]
let currentData = null;

// --- Drag/Pan logiikka ---
let drag = false, dragStart = {x:0, y:0}, savedOffset = {x:0, y:0};
canvasArea.onmousedown = function(e){
  drag = true;
  dragStart.x = e.clientX; dragStart.y = e.clientY;
  savedOffset.x = pageState.offsetX; savedOffset.y = pageState.offsetY;
};
document.body.onmouseup = function(){ drag = false; };
document.body.onmousemove = function(e){
  if(!drag) return;
  pageState.offsetX = Math.max(Math.min(savedOffset.x + (e.clientX-dragStart.x), 0), -800*pageState.zoom+800);
  pageState.offsetY = Math.max(Math.min(savedOffset.y + (e.clientY-dragStart.y), 0), -440*pageState.zoom+440);
  redrawCurrent();
};

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
document.getElementById('zoomIn').onclick =()=>{ pageState.zoom=Math.min(3.0,pageState.zoom+0.2); redrawCurrent(); }
document.getElementById('zoomOut').onclick =()=>{ pageState.zoom=Math.max(0.4,pageState.zoom-0.2); redrawCurrent(); }

async function loadPage(idx){
  const total = pdfFiles.length + imgFiles.length;
  if(idx<0 || idx>=total) return;
  pageState.index = idx;
  document.getElementById('pageLabel').textContent = `${idx+1}/${total}`;
  canvasArea.innerHTML = "";

  pageState.offsetX=0; pageState.offsetY=0;
  let f = idx < pdfFiles.length ? pdfFiles[idx] : imgFiles[idx-pdfFiles.length];
  let c = document.createElement('canvas');
  c.width=800; c.height=440;
  c.style.position = 'absolute';
  c.style.left = pageState.offsetX + "px";
  c.style.top = pageState.offsetY + "px";
  canvasArea.appendChild(c);
  let ctx = c.getContext('2d');

  if(f.type==="application/pdf"){
    let fr = new FileReader();
    fr.onload = async function(evt){
      let pdf = await pdfjsLib.getDocument(new Uint8Array(evt.target.result)).promise;
      let page = await pdf.getPage(1);
      let scale = Math.min(800/page.view[2], 440/page.view[3]) * pageState.zoom; // ADAPTIVE SCALING
      let vp = page.getViewport({scale});
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
        let scale = Math.min(800/img.width, 440/img.height)*pageState.zoom;
        c.width=img.width*scale; c.height=img.height*scale;
        ctx.drawImage(img,0,0,img.width*scale,img.height*scale);
        afterImageLoaded(c);
      }
      img.src = e2.target.result;
    }
    fr.readAsDataURL(f);
  }
}

function redrawCurrent(){
  // Liikuta ja skaalaa kuvan canvas-objektia
  let c = canvasArea.querySelector('canvas');
  if(!c) return;
  c.style.left = pageState.offsetX + "px";
  c.style.top = pageState.offsetY + "px";
  c.style.transform = `scale(${pageState.zoom})`;
}

// --- Mittaus/Merkitse-napit ja viivan piirto ---
let measureMode = false;
document.getElementById('addMeasure').onclick = function(){
  measureMode = true;
  canvasArea.style.cursor = 'crosshair';
};
document.getElementById('deleteMeasure').onclick = function(){
  if(currentData && currentData.measures.length>0)
    currentData.measures.pop();
  drawMeasures(currentData);
};
document.getElementById('clearMeasures').onclick = function(){
  if(currentData) currentData.measures = [];
  drawMeasures(currentData);
};

canvasArea.onclick = function(e){
  if(!measureMode) return;
  let c = canvasArea.querySelector('canvas');
  const rect = c.getBoundingClientRect();
  let x = (e.clientX-rect.left-pageState.offsetX)/pageState.zoom;
  let y = (e.clientY-rect.top-pageState.offsetY)/pageState.zoom;
  if(!currentData.tempPt) { currentData.tempPt={x,y}; return; }
  // Luodaan mittaviiva
  currentData.measures.push({x1:currentData.tempPt.x, y1:currentData.tempPt.y, x2:x, y2:y});
  currentData.tempPt=null; measureMode=false; canvasArea.style.cursor='auto';
  drawMeasures(currentData);
}

function drawMeasures(data){
  // Piirrä kaikki mittaviivat ja pituudet päälle (canvasilla)
  let c = canvasArea.querySelector('canvas');
  if(!c || !data) return;
  let ctx = c.getContext('2d');
  redrawCurrent();
  // AI-overlay viivat halutessa
  if(data.aiData && data.aiData.lines)
    drawAiOverlay(c, data.aiData.lines);
  // Käyttäjän omat mittaviivat
  data.measures.forEach(m=>{
    ctx.strokeStyle = "#4378f2"; ctx.lineWidth=4; ctx.beginPath();
    ctx.moveTo(m.x1,m.y1); ctx.lineTo(m.x2,m.y2); ctx.stroke();
    let dist = Math.sqrt(Math.pow(m.x2-m.x1,2)+Math.pow(m.y2-m.y1,2))/70;
    ctx.font="15px Arial"; ctx.fillStyle="#111";
    ctx.fillText(dist.toFixed(2)+"m",(m.x1+m.x2)/2,(m.y1+m.y2)/2-10);
  });
  showAllMeasurements();
}

function afterImageLoaded(canvas){
  currentData = {canvas, aiData: {lines:[]}, measures: []};
  analysisResults[pageState.index]=currentData;
  fetch('https://OMA-BACKENDI/analyze-pdf',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({image:canvas.toDataURL()})
  }).then(r=>r.json()).then(ai=>{
    currentData.aiData = ai;
    drawMeasures(currentData);
    initMeasureInput(canvas, ai.lines||[]);
    calcPriceAndShow();
  }).catch(_=>{
    drawMeasures(currentData);
    initMeasureInput(canvas, []);
    calcPriceAndShow();
  });
}

function showAllMeasurements(){
  const mDiv = document.getElementById('measurements'); mDiv.innerHTML = "";
  if(!currentData) return;
  currentData.measures.forEach((m,i)=>{
    let dist = Math.sqrt(Math.pow(m.x2-m.x1,2)+Math.pow(m.y2-m.y1,2))/70;
    mDiv.innerHTML += `<span class="measure-label">Mittaviiva ${i+1}: <input type="number" value="${dist.toFixed(2)}" step="0.01" class="measure-edit" onchange="updateMeasure(${i},this.value)"> m <button class="measure-edit" onclick="removeUserMeasure(${i})">Poista</button></span><br>`;
  });
}
window.updateMeasure = function(idx,val){
  // Päivitä mittaviivan pituutta (vain label, ei visuaalinen reititys, laajenna halutessa!)
}
window.removeUserMeasure = function(idx){
  if(currentData) { currentData.measures.splice(idx,1); drawMeasures(currentData); }
}

// --- AI/viiva overlay (sama kuin aiemmin)
function drawAiOverlay(canvas, lines){
  const ctx = canvas.getContext('2d');
  lines.forEach(line=>{
    ctx.beginPath();
    ctx.moveTo(line.x1,line.y1); ctx.lineTo(line.x2,line.y2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = (line.type=="kaide"?"blue":"red");
    ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
    let dist = Math.sqrt(Math.pow(line.x2-line.x1,2)+Math.pow(line.y2-line.y1,2))/70;
    ctx.font="15px Arial"; ctx.fillStyle="#333";
    ctx.fillText(dist.toFixed(2)+'m',(line.x1+line.x2)/2,(line.y1+line.y2)/2-8);
  });
}

// -- Konfiguraattorin UI (materiaalit, toimitus, värivalinnat) kuten ennen --
// ...Voit käyttää aiempaa pricecalc.js:ää/hinnanlaskentaosiota... (ei muutoksia)

// --- 3D-mallin PYÖRITTÄMINEN ja zoom ---
let threeRenderer = null, threeScene = null, threeCamera = null, threeControls = null;
document.getElementById("preview-3d").onclick=function(){
  // THREE.js basic orbit controls (pyöritys, zoom, drag)
  const canvas=document.getElementById("three-canvas");
  if(!threeRenderer){
    threeRenderer = new THREE.WebGLRenderer({canvas,antialias:true});
    threeRenderer.setClearColor(0xe6e9ef);
    threeScene = new THREE.Scene();
    threeCamera = new THREE.PerspectiveCamera(45, canvas.width/canvas.height,0.1,1000);
    threeCamera.position.set(2,1.2,5);
    let light = new THREE.AmbientLight(0xffffff,1.2); threeScene.add(light);

    // OrbitControls by CDN:
    const script = document.createElement('script');
    script.src="https://unpkg.com/three@0.140.0/examples/js/controls/OrbitControls.js";
    script.onload = ()=>{ 
      threeControls = new THREE.OrbitControls(threeCamera,canvas);
      threeControls.enableZoom = true; threeControls.enableRotate = true;
      render3D();
    };
    document.body.appendChild(script);
  } else {
    render3D();
  }
};
function render3D(){
  // Tyhjennä scene
  while(threeScene.children.length > 1) threeScene.remove(threeScene.children[1]);
  // Demona: renderoidut linjat sekä AI-viivat että käyttäjän mittaviivat
  [currentData.aiData.lines||[],currentData.measures||[]].forEach(arr=>{
    arr.forEach(line=>{
      let length = Math.sqrt(Math.pow((line.x2||0)-(line.x1||0),2)+Math.pow((line.y2||0)-(line.y1||0),2))/150;
      let geo = new THREE.BoxGeometry(length,0.04,(line.type=="kaide"?0.04:0.02)||0.025);
      let mat = new THREE.MeshStandardMaterial({color:line.type=="kaide"?0x3333cc:0xff2233});
      let viiva = new THREE.Mesh(geo,mat);
      viiva.position.set(0,1.0,(line.type=="kaide"?0:0.4));
      threeScene.add(viiva);
    });
  });
  threeRenderer.render(threeScene, threeCamera);
}
