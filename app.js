document.getElementById('companyChk').onchange=function(){
  document.getElementById('companyFields').style.display=this.checked?'block':'none';
};

document.getElementById('fileinput').onchange=function(e){
  let file=e.target.files[0];
  let reader=new FileReader();
  reader.onload=function(ev){
    pdfjsLib.getDocument(new Uint8Array(ev.target.result)).promise.then(pdf=>{
      window.pdfDoc=pdf;
      window.pdfState.page=1;
      renderPdfPage(pdf,1);
    });
  }; reader.readAsArrayBuffer(file);
};

function renderPdfPage(pdf, pageNum){
  pdf.getPage(pageNum).then(page=>{
    let vp=page.getViewport({scale:1});
    let canvas=document.createElement('canvas');
    canvas.width=vp.width; canvas.height=vp.height;
    document.getElementById('pdfCanvasArea').innerHTML="";
    document.getElementById('pdfCanvasArea').appendChild(canvas);
    window.initCanvas(canvas);
    page.render({canvasContext:canvas.getContext('2d'), viewport:vp}).promise.then(()=>window.drawLayers());
  });
}
document.getElementById('pdfPrev').onclick=function(){
  if(window.pdfDoc && window.pdfState.page>1){
    window.pdfState.page-=1;
    renderPdfPage(window.pdfDoc,window.pdfState.page);
  }
};
document.getElementById('pdfNext').onclick=function(){
  if(window.pdfDoc && window.pdfState.page<window.pdfDoc.numPages){
    window.pdfState.page+=1;
    renderPdfPage(window.pdfDoc,window.pdfState.page);
  }
};
document.getElementById('zoomIn').onclick=function(){window.pdfState.zoom=Math.min(3.0,window.pdfState.zoom+0.2);window.drawLayers();}
document.getElementById('zoomOut').onclick=function(){window.pdfState.zoom=Math.max(0.5,window.pdfState.zoom-0.2);window.drawLayers();}
document.getElementById('mittasuhde').oninput=function(){let v=this.value.split(':')[1];window.pdfState.scaleFactor=parseFloat(v)||50;window.drawLayers();};
document.getElementById('setScaleBtn').onclick=function(){alert('Klikkaa mittaviivan alku ja loppupiste kuvalta!')};

document.getElementById('addKaideMeasure').onclick=function(){window.measureAddStart("kaide");};
document.getElementById('addHandrailMeasure').onclick=function(){window.measureAddStart("käsijohde");};
document.getElementById('clearMeasures').onclick=function(){window.manualMeasures=[]; window.drawLayers(); window.showMeasures();};

window.showMeasures=function(){
  let html = window.manualMeasures.map((m,i)=>`<span>${m.type} ${i+1}: ${m.length.toFixed(2)} m <button onclick="removeMeasure(${i})">Poista</button></span>`).join(" ");
  document.getElementById('measurements').innerHTML=html;
};
window.removeMeasure=function(i){window.manualMeasures.splice(i,1);window.drawLayers();window.showMeasures();};

function fillProductForm(){
  document.getElementById('productform').innerHTML=`
  <div class="row">
    <label>Tuote:</label>
    <select id="productSelect"><option value="pinnakaide">Pinnakaide</option><option value="lattakaide">Lattakaide</option></select>
    <label>Pintakäsittely kaiteelle:</label>
    <select id="kaideFinish"><option value="maalaus">Maalaus</option></select>
    <label>Pintakäsittely käsijohteelle:</label>
    <select id="handrailFinish"><option value="maalaus">Maalaus</option><option value="rst">RST</option></select>
    <label>Asennus:</label>
    <select id="installOption"><option value="ei">Ei</option><option value="kyllä">Kyllä</option></select>
    <label>Nousukaide?</label>
    <select id="isStair"><option value="ei">Tasokaide</option><option value="kyllä">Nousukaide</option></select>
  </div>
  `; 
  ['productSelect','kaideFinish','handrailFinish','installOption','isStair'].forEach(id=>{
    document.getElementById(id).oninput=window.calcPrice;
  });
  window.calcPrice();
}
fillProductForm();

document.getElementById('sendOfferBtn').onclick = function(){
  // Kerää kaikki
  const name=document.getElementById('contactName').value,
         email=document.getElementById('contactEmail').value,
         phone=document.getElementById('contactPhone').value,
         addr=document.getElementById('contactAddr').value,
         company=document.getElementById('companyName')?.value,
         project=document.getElementById('projectName')?.value,
         caddr=document.getElementById('companyAddr')?.value,
         respName=document.getElementById('respName')?.value,
         respPhone=document.getElementById('respPhone')?.value,
         respEmail=document.getElementById('respEmail')?.value;

  let product=document.getElementById('productSelect').value,
      kaideFinish=document.getElementById('kaideFinish').value,
      handrailFinish=document.getElementById('handrailFinish').value,
      install=document.getElementById('installOption').value,
      isStair=document.getElementById('isStair').value;

  let aiResults=window.aiLines, manualResults=window.manualMeasures;
  let price = window.calcPrice();
  let files = Array.from(document.getElementById('fileinput').files).map(f=>f.name);

  window.createOfferPDF({
    name,email,phone,addr,company,project,caddr,respName,respPhone,respEmail,
    product,kaideFinish,handrailFinish,install,isStair,
    aiResults,manualResults, price, fileNames: files,
    kaidePituus: manualResults.filter(m=>m.type=="kaide").reduce((a,m)=>a+m.length, 0) + aiResults.filter(l=>l.type=="kaide").reduce((a,l)=>a+l.length,0),
    handrailPituus: manualResults.filter(m=>m.type=="käsijohde").reduce((a,m)=>a+m.length, 0) + aiResults.filter(l=>l.type=="käsijohde").reduce((a,l)=>a+l.length,0)
  });
};

window.onload=function(){window.drawLayers();window.showMeasures();window.calcPrice();}
