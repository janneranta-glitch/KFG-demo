let scaleFactor=60, pdfZoom=1.0, pdfFile,names=[],pdfPage=1,aiLines=[],manualMeasures=[];
const area = document.getElementById('pdfCanvasArea');
// PDF/kuva lataus
document.getElementById('fileinput').onchange=function(e){
  pdfFile = e.target.files[0]; names = Array.from(e.target.files).map(f=>f.name);
  renderPage(pdfFile,pdfZoom);
};

function renderPage(file, zoom) {
  area.innerHTML=""; let c=document.createElement('canvas'); area.appendChild(c);
  c.width=600; c.height=340; c.style.position='absolute'; let ctx=c.getContext('2d');
  if(file.type==="application/pdf"){
    let fr=new FileReader();
    fr.onload=async function(evt){
      let pdf=await pdfjsLib.getDocument(new Uint8Array(evt.target.result)).promise;
      let page=await pdf.getPage(pdfPage);
      let scale=Math.min(600/page.view[2],340/page.view[3]) * zoom;
      let vp=page.getViewport({scale}); c.width=vp.width; c.height=vp.height;
      await page.render({canvasContext:ctx,viewport:vp}).promise;
      drawAll(ctx);
    }; fr.readAsArrayBuffer(file);
  }else{
    let fr = new FileReader();
    fr.onload=function(e2){
      let img=new Image();
      img.onload=function(){
        let scale=Math.min(600/img.width,340/img.height)*zoom;
        c.width=img.width*scale; c.height=img.height*scale;
        ctx.drawImage(img,0,0,img.width*scale,img.height*scale);
        drawAll(ctx);
      }; img.src = e2.target.result;
    }; fr.readAsDataURL(file);
  }
}

function drawAll(ctx){
  // Piirrä AI-mitat
  aiLines.forEach(l=>{
    ctx.save();
    ctx.strokeStyle = l.type=="kaide" ? "#247bee":"#22a3a7";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(l.x1,l.y1); ctx.lineTo(l.x2,l.y2); ctx.stroke();
    let dist = l.length;
    ctx.font="15px Montserrat"; ctx.fillStyle="#247bee";
    ctx.fillText(dist.toFixed(2)+" m",(l.x1+l.x2)/2,(l.y1+l.y2)/2-6);
    ctx.restore();
  });
  // Piirrä manuaaliset mitat
  manualMeasures.forEach(m=>{
    ctx.save();
    ctx.strokeStyle = "#c41e16"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(m.x1,m.y1); ctx.lineTo(m.x2,m.y2); ctx.stroke();
    let dist = m.length;
    ctx.font="13px Montserrat"; ctx.fillStyle="#c41e16";
    ctx.fillText(dist.toFixed(2)+" m",(m.x1+m.x2)/2,(m.y1+m.y2)/2-6);
    ctx.restore();
  });
}

// Zoom-napit
document.getElementById('zoomIn').onclick=function(){ pdfZoom=Math.min(2.5,pdfZoom+0.2); renderPage(pdfFile,pdfZoom);}
document.getElementById('zoomOut').onclick=function(){ pdfZoom=Math.max(0.7,pdfZoom-0.2); renderPage(pdfFile,pdfZoom);}

// Mock-AI: lisää testilineja (voit korvata backendin tuloksilla)
function mockAI(){
  aiLines = [
    {type:"kaide",x1:94,y1:52,x2:324,y2:140,length:6.88},
    {type:"käsijohde",x1:40,y1:230,x2:280,y2:250,length:3.22}
  ];
}
mockAI();

// Mittakaava
let scaleSetMode=false, scalePts=[];
document.getElementById('setScaleBtn').onclick=function(){
  scaleSetMode=true; scalePts=[];
  area.style.cursor="crosshair";
};
area.onclick=function(e){
  if(scaleSetMode){
    let c=area.querySelector('canvas'),rect=c.getBoundingClientRect();
    let x=(e.clientX-rect.left)/pdfZoom, y=(e.clientY-rect.top)/pdfZoom;
    scalePts.push({x,y}); if(scalePts.length==2){
      let l=Math.sqrt(Math.pow(scalePts[0].x-scalePts[1].x,2)+Math.pow(scalePts[0].y-scalePts[1].y,2));
      let m=prompt("Syötä mittaviivan todellinen pituus (m):");
      scaleFactor = l/(parseFloat(m)||1);
      scaleSetMode=false; area.style.cursor="auto";
      alert("Mittakaava asetettu!");
    }
  }
};

// Mittaviiva: AddMeasure
let measureStep=0, tmpM={};
document.getElementById('addMeasure').onclick = function(){
  area.style.cursor="crosshair"; measureStep=0;
};
area.addEventListener('click',function(e){
  if(scaleSetMode) return;
  if(measureStep===0){
    let c=area.querySelector('canvas'),rect=c.getBoundingClientRect();
    tmpM.x1=(e.clientX-rect.left)/pdfZoom; tmpM.y1=(e.clientY-rect.top)/pdfZoom;
    measureStep=1;
  }else if(measureStep===1){
    let c=area.querySelector('canvas'),rect=c.getBoundingClientRect();
    tmpM.x2=(e.clientX-rect.left)/pdfZoom; tmpM.y2=(e.clientY-rect.top)/pdfZoom;
    tmpM.length=Math.sqrt(Math.pow(tmpM.x1-tmpM.x2,2)+Math.pow(tmpM.y1-tmpM.y2,2))/(scaleFactor||60);
    manualMeasures.push({...tmpM}); tmpM={}; measureStep=0; area.style.cursor="auto";
    renderPage(pdfFile,pdfZoom);
    showAllMeasurements();
    updateSummary();
    priceCalc();
  }
});
document.getElementById('clearMeasures').onclick=function(){manualMeasures=[];renderPage(pdfFile,pdfZoom);showAllMeasurements();updateSummary();priceCalc();}

// AI/Manuaalimäärät, kokonaissumma
function updateSummary(){
  let aiSum = aiLines.reduce((s,l)=>s+l.length,0);
  let manSum = manualMeasures.reduce((s,m)=>s+m.length,0);
  document.getElementById('aiTotal').textContent = aiSum.toFixed(2);
  document.getElementById('manualTotal').textContent = manSum.toFixed(2);
  document.getElementById('allTotal').textContent = (aiSum+manSum).toFixed(2);
}

// Mittojen poisto ja editori
function showAllMeasurements(){
  document.getElementById('measurements').innerHTML =
    manualMeasures.map((m,i)=>`<span>Mittaviiva ${i+1}: ${m.length.toFixed(2)} m <button onclick="delMeas(${i})">Poista</button></span><br>`).join("");
}
window.delMeas=function(i){ manualMeasures.splice(i,1); renderPage(pdfFile,pdfZoom); showAllMeasurements(); updateSummary(); priceCalc(); }

// Tuote/pintakäsittely/asennus/kerroin -laskenta
['productSelect','kaideFinish','handrailFinish','installOption','isStair','kaideLen','handLen'].forEach(id=>{
  document.getElementById(id).oninput=priceCalc;
});
function priceCalc(){
  let tyyppi=document.getElementById('productSelect').value,
      pintak=document.getElementById('kaideFinish').value,
      handFinish=document.getElementById('handrailFinish').value,
      install=document.getElementById('installOption').value,
      stair=document.getElementById('isStair').value,
      kaidemanual=Number(document.getElementById('kaideLen').value)||0,
      handmanual=Number(document.getElementById('handLen').value)||0;
  let aiKaideSum=aiLines.filter(l=>l.type==="kaide").reduce((s,l)=>s+l.length,0),
      aiHandrailSum=aiLines.filter(l=>l.type==="käsijohde").reduce((s,l)=>s+l.length,0),
      manualSum=manualMeasures.reduce((a,m)=>a+m.length,0);
  let stairK = stair==="kyllä"?1.2:1;
  let totalKaide = (aiKaideSum + kaidemanual + manualSum)*stairK;
  let totalHand = (aiHandrailSum + handmanual)*stairK;
  let priceKaide = tyyppi==='pinnakaide'?230:350;
  let priceHand = handFinish==='maalaus'?8:9;
  let installCost = install==='kyllä'?totalKaide*45:0;
  let hinta = totalKaide*priceKaide + totalHand*priceHand + installCost;
  document.getElementById('pricebox').innerHTML =
    `<b>Kaiteet yhteensä:</b> ${totalKaide.toFixed(2)} m<br>
    <b>Käsijohteet yhteensä:</b> ${totalHand.toFixed(2)} m<br>
    <b>Kokonaishinta:</b> <span style="color:#00609A;">${hinta.toFixed(2)} € + alv 0</span>`;
}
priceCalc();

// PDF-tarjous generointi ja liitetiedostot
document.getElementById('sendOfferBtn').onclick = function(){
  // tiedot
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const phone = document.getElementById('contactPhone').value;
  const addr = document.getElementById('contactAddr').value;
  const tyyppi = document.getElementById('productSelect').value;
  const pintak = document.getElementById('kaideFinish').value;
  const handFinish = document.getElementById('handrailFinish').value;
  const install = document.getElementById('installOption').value;
  const stair = document.getElementById('isStair').value;
  const files = document.getElementById('fileinput').files;
  // PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(15);
  doc.text(`Kymppikaide | Tarjous`, 17, 20);
  doc.text(`Nimi: ${name}`,17,33);
  doc.text(`Email: ${email}`,17,39);
  doc.text(`Puh.: ${phone}`,17,45);
  doc.text(`Osoite: ${addr}`,17,51);
  doc.text(`Tuote: ${tyyppi} | Kaiteen pintakäsittely: ${pintak} | Käsijohteen: ${handFinish}`,17,60);
  doc.text(`Asennus: ${install} | Nousukaide?: ${stair}`,17,67);
  doc.text('AI-tunnistetut kaiteet:',17,76);
  aiLines.forEach((l,i)=>doc.text(`${i+1}. ${l.type} ${l.length.toFixed(2)} m`,19,83+i*7));
  let aiOffset = 83+aiLines.length*7;
  doc.text('Manuaaliset mitat:',17,aiOffset+8);
  manualMeasures.forEach((m,i)=>doc.text(`${i+1}. ${m.length.toFixed(2)} m`,19,aiOffset+15+i*7));
  let fileOffset = aiOffset+35;
  doc.text('Liitetiedostot:',17,fileOffset);
  Array.from(files).forEach((f,i)=>doc.text(`- ${f.name}`,19,fileOffset+7+i*7));
  doc.text('Yhteenveto:',17,fileOffset+25+7);
  doc.text(`Kaide yhteensä: ${(aiLines.filter(l=>l.type=="kaide").reduce((a,b)=>a+b.length,0)+manualMeasures.reduce((a,b)=>a+b.length,0)).toFixed(2)} m`,19,fileOffset+32+7);
  doc.text(`Käsijohde yhteensä: ${(aiLines.filter(l=>l.type=="käsijohde").reduce((a,b)=>a+b.length,0)).toFixed(2)} m`,19,fileOffset+39+7);
  doc.text(document.getElementById('pricebox').textContent,19,fileOffset+49+7);
  doc.save('Tarjous_Kymppikaide.pdf');
  alert("Tarjous generoitin PDF-tiedostoksi – liitteet ja merkinnät mukana!");
}
