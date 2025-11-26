let scaleFactor = 70, scaleMode=false, scalePt1=null;
let kaidetyypit = {
  pinnakaide: {sisä:230, ulkona:290 }, 
  lattakaide:{sisä:350, ulkona:440 }
};
let pdfCanvas = null, pdfCanvasReal=null;
let lastImgType = null;

document.getElementById('fileinput').onchange = function(e){
  let f = e.target.files[0];
  lastImgType = f.type;
  loadPdfOrImage(f);
};

function loadPdfOrImage(f){
  document.getElementById('pdfCanvasArea').innerHTML = "";
  let c = document.createElement('canvas'); c.width=500; c.height=320;
  c.style.position='absolute';
  document.getElementById('pdfCanvasArea').appendChild(c);
  pdfCanvas=c;
  if(f.type==="application/pdf"){
    let fr = new FileReader();
    fr.onload = async function(evt){
      let pdf = await pdfjsLib.getDocument(new Uint8Array(evt.target.result)).promise;
      let page = await pdf.getPage(1);
      let scale = Math.min(500/page.view[2],320/page.view[3]);
      let vp = page.getViewport({scale});
      c.width = vp.width; c.height=vp.height;
      let ctx = c.getContext('2d');
      await page.render({canvasContext:ctx,viewport:vp}).promise;
      pdfCanvasReal={width:vp.width, height:vp.height, scale};
    };
    fr.readAsArrayBuffer(f);
  } else {
    let fr = new FileReader();
    fr.onload = function(e2){
      let img = new window.Image();
      img.onload = function(){
        let scale = Math.min(500/img.width, 320/img.height);
        c.width=img.width*scale; c.height=img.height*scale;
        let ctx = c.getContext('2d');
        ctx.drawImage(img,0,0,img.width*scale,img.height*scale);
        pdfCanvasReal={width:img.width*scale, height:img.height*scale, scale};
      }
      img.src = e2.target.result;
    }
    fr.readAsDataURL(f);
  }
}

// --- Mittakaavan asetus: mittaviivan piirtäminen ---
document.getElementById('setScaleBtn').onclick = function(){
  scaleMode = true; scalePt1=null;
  document.getElementById('scaleForm').style.display="block";
  pdfCanvas.style.cursor='crosshair';
};
document.getElementById('confirmScaleBtn').onclick = function(){
  let m = parseFloat(document.getElementById('scaleMeters').value);
  if(scalePt1 && scalePt1.x!==undefined && scalePt1.y!==undefined && scalePt2 && scalePt2.x!==undefined && scalePt2.y!==undefined){
    let pxLen = Math.sqrt(Math.pow(scalePt2.x-scalePt1.x,2)+Math.pow(scalePt2.y-scalePt1.y,2));
    scaleFactor = pxLen / m;
    alert("Mittakaava kalibroitu: "+scaleFactor.toFixed(2)+" px/m");
    document.getElementById('scaleForm').style.display="none";
    pdfCanvas.style.cursor='auto';
  }
}

let scalePt2=null;
if(pdfCanvas){
  pdfCanvas.onclick=function(e){
    if(!scaleMode) return;
    var rect=pdfCanvas.getBoundingClientRect();
    let x = e.clientX-rect.left, y = e.clientY-rect.top;
    if(!scalePt1){ scalePt1={x,y}; } else { scalePt2={x,y}; }
  }
}

// --- Laskenta UI: hinnoittelu jne ---
['kaidetyyppi','pintakäsittely','tasokaide','nousukaidepn','handrailpn','nousukaide'].forEach(id=>{
  document.getElementById(id).oninput = calcOffer;
});
function calcOffer(){
  let tyyppi = document.getElementById('kaidetyyppi').value,
      pintak = document.getElementById('pintakäsittely').value,
      nousuk = document.getElementById('nousukaide').value,
      tpm = parseFloat(document.getElementById('tasokaide').value)||0,
      npm = parseFloat(document.getElementById('nousukaidepn').value)||0,
      hpm = parseFloat(document.getElementById('handrailpn').value)||0;

  // Hinta
  let nousuKer = nousuk=="kyllä"?1.2:1;
  let kaideH = tyyppi=="pinnakaide"
      ? (tpm*kaidetyypit.pinnakaide.sisä + npm*nousuKer*kaidetyypit.pinnakaide.sisä)
      : (tpm*kaidetyypit.lattakaide.sisä + npm*nousuKer*kaidetyypit.lattakaide.sisä);
  let käsijohdeH = pintak=="maalaus" ? hpm*8 : hpm*9;
  let kokohinta = kaideH + käsijohdeH;

  document.getElementById('tarjouslaatikko').innerHTML = `
    <b>Tarjous valmis:</b><br>
    Pituus: ${(tpm+npm+hpm).toFixed(2)} m <br>
    Hinta: ${kokohinta.toFixed(2)} €<br>
    <button onclick="alert('Lähetä tarjous')" style="margin-top:7px;padding:8px 20px;background:#16ccc7;border-radius:7px;border:none;color:white;font-size:1.1em;">LASKE TARJOUS</button>
  `;
}
