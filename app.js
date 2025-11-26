// Lataa PDF/kuva; renderoi canvas aina uudelleen kun zoom/sivu vaihtuu
// Mittausnappien toiminta, viivojen piirto (mittaus.js), hintojen päivitykset (pricecalc.js)
import { applyAiLabels } from "./ai.js";
import { mittaaJaMerkitse, laskeViivanPituus, laskeNousukulma } from "./mittaus.js";
import { laskeHinta } from "./pricecalc.js";
import { createOfferPDF } from "./offerpdf.js";

let pdfFile=null, pdfDoc=null, pdfPageNum=1, pdfNumPages=1, pdfCanvas=null, pdfCtx=null,
    zoom=1.0, panX=0, panY=0, mittasuhde=50, scaleFactor=50,
    aiLines=[], manualMeasures=[], measureType="kaide";

document.getElementById('fileinput').onchange = function(e){
  pdfFile = e.target.files[0];
  loadPdf(pdfFile,1);
};
function loadPdf(file,pageNum){
  let fr=new FileReader();
  fr.onload=async function(evt){
    pdfDoc=await pdfjsLib.getDocument(new Uint8Array(evt.target.result)).promise;
    pdfNumPages=pdfDoc.numPages;
    renderPdfPage(pageNum);
  }; fr.readAsArrayBuffer(file);
}
function renderPdfPage(pageNum){
  pdfDoc.getPage(pageNum).then(page=>{
    let vp=page.getViewport({scale:1});
    pdfCanvas=document.createElement('canvas');
    pdfCanvas.width=vp.width; pdfCanvas.height=vp.height;
    pdfCtx=pdfCanvas.getContext('2d');
    page.render({canvasContext:pdfCtx,viewport:vp}).promise.then(()=>{
      drawAllLayers();
    });
  });
}
function drawAllLayers(){
  // Piirrä AI, manuaaliviivat
  applyAiLabels(pdfCanvas, aiLines, pdfCtx, scaleFactor, zoom, panX, panY);
  mittaaJaMerkitse(pdfCanvas, manualMeasures, pdfCtx, scaleFactor, zoom, panX, panY);
}
document.getElementById('pdfPrev').onclick=function(){
  pdfPageNum = Math.max(1,pdfPageNum-1); renderPdfPage(pdfPageNum);
};
document.getElementById('pdfNext').onclick=function(){
  pdfPageNum = Math.min(pdfNumPages,pdfPageNum+1); renderPdfPage(pdfPageNum);
};
document.getElementById('zoomIn').onclick=function(){ zoom=Math.min(3.0,zoom+0.2); drawAllLayers(); }
document.getElementById('zoomOut').onclick=function(){ zoom=Math.max(0.5,zoom-0.2); drawAllLayers(); }
document.getElementById('mittasuhdekentta').oninput=function(){
  let val = this.value.split(":")[1]; mittasuhde=parseFloat(val)||50; scaleFactor=mittasuhde;
  drawAllLayers();
};
// Mittaustoiminnon napit
document.getElementById('addKaideMeasure').onclick=function(){measureType="kaide"; mittaaJaMerkitse.start(pdfCanvas,measureType);}
document.getElementById('addHandrailMeasure').onclick=function(){measureType="käsijohde"; mittaaJaMerkitse.start(pdfCanvas,measureType);}
document.getElementById('clearMeasures').onclick=function(){ manualMeasures=[]; drawAllLayers(); }
// AI-napille: filteröidään vain kaide ja käsijohdeviivat (ai.js)
aiLines = window.filterAiLines(aiLines); // mock-kutsu, korvaa oikealla datalla

// Logo näkyy (css ja index.html jo hoitaa sen)
