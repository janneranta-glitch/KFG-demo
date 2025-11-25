window.DrawState = {
  points: [],
  handrail: [],
  mode: 'kaide',  // 'kaide' | 'käsijohde'
  scale: 1, // px/m (kalibrointi, oletus 70)
  canvas: null,
  undoStack: [],
  type: 'canvas', // "canvas" (voit laajentaa SVG/Fabric/Konva)
  pohja: 'terassi', // "terassi" | "porras"
};
window.initDrawing = function() {
  const d = document.getElementById('draw-section');
  d.innerHTML = `
    <div class="buttonrow">
      <button id="mode-kaide" class="active">Piirrä kaide</button>
      <button id="mode-handrail">Piirrä käsijohde</button>
      <button id="undo">Undo</button>
      <button id="clear">Tyhjennä</button>
      <button id="calibrate">Kalibroi mittakaava</button>
      <input type="file" id="bgimg" accept=".jpg,.jpeg,.png">
    </div>
    <canvas id="draw-canvas" width="900" height="400"></canvas>
    <div>
      <label>Pohja:</label>
      <select id="drawing-pohja">
        <option value="terassi">Terassi</option>
        <option value="porras">Porras</option>
      </select>
      <span id="terassi-options">
        Leveys <input id="terassi-w" type="number" value="3.2" step="0.1" style="width:45px;">m
        Pituus <input id="terassi-h" type="number" value="5.5" step="0.1" style="width:45px;">m
        Korkeus <input id="terassi-k" type="number" value="1.1" step="0.1" style="width:45px;">m
      </span>
      <span id="porras-options" style="display:none">
        Askelmia <input id="porras-n" type="number" value="8" min="2" max="30" style="width:32px;">
        Nousu <input id="porras-r" type="number" value="180" style="width:37px;">mm
        Etenemä <input id="porras-e" type="number" value="270" style="width:37px;">mm
      </span>
    </div>
    <div id="pituusinfo"></div>
  `;
  // mode-napit
  document.getElementById('mode-kaide').onclick = function() { setMode('kaide'); };
  document.getElementById('mode-handrail').onclick = function() { setMode('käsijohde'); };
  function setMode(m) {
    window.DrawState.mode = m;
    document.getElementById('mode-kaide').classList.toggle('active', m=='kaide');
    document.getElementById('mode-handrail').classList.toggle('active', m=='käsijohde');
  }
  document.getElementById('undo').onclick = function(){ undo(); };
  document.getElementById('clear').onclick = function(){ window.DrawState.points=[]; window.DrawState.handrail=[]; window.DrawState.undoStack=[]; drawAll(); };
  document.getElementById('calibrate').onclick = function(){ calibrateScale(); };
  document.getElementById('drawing-pohja').onchange = function(ev){
    window.DrawState.pohja = ev.target.value;
    document.getElementById('terassi-options').style.display = (ev.target.value=='terassi')?'inline':'none';
    document.getElementById('porras-options').style.display = (ev.target.value=='porras')?'inline':'none';
    drawAll();
  };
  ['terassi-w','terassi-h','terassi-k','porras-n','porras-r','porras-e'].forEach(id=>{
    document.getElementById(id).oninput=drawAll;
  });
  // kuva taustaksi
  document.getElementById('bgimg').onchange=function(e) {
    let fr=new FileReader();
    fr.onload=function(e2){
      window.DrawState.bgimg = new window.Image();
      window.DrawState.bgimg.src = e2.target.result;
      window.DrawState.bgimg.onload = drawAll;
    }
    fr.readAsDataURL(e.target.files[0]);
  };
  // klik-piirto
  const canvas = document.getElementById('draw-canvas');
  window.DrawState.canvas = canvas;
  canvas.onmousedown = function(e){
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX-rect.left, y = e.clientY-rect.top;
    if(window.DrawState.mode=='kaide') window.DrawState.points.push({x,y});
    else window.DrawState.handrail.push({x,y});
    window.DrawState.undoStack.push({mode:window.DrawState.mode, x, y});
    drawAll();
  };
  drawAll();
};

function drawAll() {
  const s = window.DrawState;
  const c = s.canvas, ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  // taustakuva
  if(s.bgimg) ctx.drawImage(s.bgimg,0,0,c.width,c.height);
  // Terassi/porras
  if(s.pohja=='terassi'){
    let w=parseFloat(document.getElementById('terassi-w').value), h=parseFloat(document.getElementById('terassi-h').value), k=parseFloat(document.getElementById('terassi-k').value);
    ctx.fillStyle="#e6e9ed"; ctx.fillRect(80,350-k*90,w*70,h*37);
    ctx.strokeStyle="#7ca826"; ctx.lineWidth=3;
    ctx.strokeRect(80,350-k*90,w*70,h*37);
  } else {
    let n=parseInt(document.getElementById('porras-n').value), r=parseInt(document.getElementById('porras-r').value), e=parseInt(document.getElementById('porras-e').value);
    let x=120, y=380;
    ctx.strokeStyle="#a38852"; ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(x,y);
    for(let i=0;i<n;i++){
      ctx.lineTo(x+e*1.1/10, y-r*1.1/10);
      x+=e*1.1/10; y-=r*1.1/10;
    }
    ctx.stroke();
  }
  // Viivat (kaide: sininen, käsijohde: punainen)
  ctx.strokeStyle="blue"; ctx.lineWidth=4;
  ctx.beginPath();
  s.points.forEach((pt,i)=>i==0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
  ctx.stroke();

  ctx.strokeStyle="red"; ctx.lineWidth=2;
  ctx.beginPath();
  s.handrail.forEach((pt,i)=>i==0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
  ctx.stroke();

  // segmenttipituudet
  let html = "<b>Kaidepituus:</b> "+sumlen(s.points, s.scale).toFixed(2)+" m | <b>Käsijohde:</b> "+sumlen(s.handrail, s.scale).toFixed(2)+" m <br>";
  html += "Muokkaa pisteitä: poista/undo, syötä uusi mittakaava kalibroinnilla";
  document.getElementById("pituusinfo").innerHTML=html;
}

function sumlen(arr, scale){
  let s=0;
  for(let i=1;i<arr.length;i++)
    s+=Math.sqrt(Math.pow(arr[i].x-arr[i-1].x,2)+Math.pow(arr[i].y-arr[i-1].y,2))/ (scale || 70);
  return s;
}
function undo(){
  let s=window.DrawState, u = s.undoStack.pop();
  if(!u) return;
  if(u.mode=='kaide') s.points.pop();
  else s.handrail.pop();
  drawAll();
}
function calibrateScale(){
  // Kysy käyttäjältä alku/loppupisteet mittakaavan määritykseen
  let px = prompt("Syötä kahden pisteen välinen etäisyys pikseleinä (esim. kuvasta)"), m = prompt("Syötä todellinen etäisyys metreinä");
  let scale = px / m;
  if(scale > 0) window.DrawState.scale = scale;
  drawAll();
}
