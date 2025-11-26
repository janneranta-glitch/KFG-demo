// modern zoom
let zoom=1.0, offsetX=0, offsetY=0, measures=[], setScaleMode=false, scalePt=[];
const area=document.getElementById('pdfCanvasArea');

// PDF/kuva lataus
document.getElementById('fileinput').onchange=function(e){
  let f=e.target.files[0]; area.innerHTML="";
  let c=document.createElement('canvas'); area.appendChild(c);
  c.style.position='absolute'; c.width=600; c.height=340;
  let ctx=c.getContext('2d');
  if(f.type==="application/pdf"){
    let fr=new FileReader();
    fr.onload=async function(evt){
      let pdf=await pdfjsLib.getDocument(new Uint8Array(evt.target.result)).promise;
      let page=await pdf.getPage(1);
      let scale=Math.min(600/page.view[2],340/page.view[3]);
      let vp=page.getViewport({scale}); c.width=vp.width; c.height=vp.height;
      await page.render({canvasContext:ctx,viewport:vp}).promise;
    };
    fr.readAsArrayBuffer(f);
  }else{
    let fr=new FileReader();
    fr.onload=function(e2){
      let img=new Image();
      img.onload=function(){ 
        let scale=Math.min(600/img.width,340/img.height); 
        c.width=img.width*scale; c.height=img.height*scale;
        ctx.drawImage(img,0,0,img.width*scale,img.height*scale); 
      }; img.src=e2.target.result;
    }; fr.readAsDataURL(f);
  }
}

document.getElementById('zoomIn').onclick=function(){ zoom=Math.min(2.5,zoom+0.2); updateZoom();}
document.getElementById('zoomOut').onclick=function(){ zoom=Math.max(0.7,zoom-0.2); updateZoom();}
function updateZoom(){ let c=area.querySelector('canvas'); if(c) c.style.transform=`scale(${zoom})`; }

// mittakaava: kalibrointi
document.getElementById('setScaleBtn').onclick=function(){ setScaleMode=true; scalePt=[]; area.style.cursor="crosshair"; }
area.onclick=function(e){
  if(setScaleMode){
    let c=area.querySelector('canvas'), rect=c.getBoundingClientRect();
    let x=(e.clientX-rect.left)/zoom, y=(e.clientY-rect.top)/zoom;
    scalePt.push({x,y}); 
    if(scalePt.length==2){
      let l=Math.sqrt(Math.pow(scalePt[1].x-scalePt[0].x,2)+Math.pow(scalePt[1].y-scalePt[0].y,2));
      let m=prompt("Syötä mittaviivan todellinen pituus (m):"); 
      window.scaleFactor=l/(parseFloat(m)||1);
      setScaleMode=false; area.style.cursor="auto";
      alert("Mittakaava asetettu! Jatka merkintöjen tekemistä.");
    }
    return;
  }
};

document.getElementById('addMeasure').onclick=function(){
  area.style.cursor="crosshair"; measureStep=0;
};
let measureStep=0, tmpM={};
area.addEventListener('click',function(e){
  if(measureStep===0){ 
    let c=area.querySelector('canvas'),rect=c.getBoundingClientRect();
    tmpM.x1=(e.clientX-rect.left)/zoom; tmpM.y1=(e.clientY-rect.top)/zoom; measureStep=1;
  }else if(measureStep===1){
    let c=area.querySelector('canvas'),rect=c.getBoundingClientRect();
    tmpM.x2=(e.clientX-rect.left)/zoom; tmpM.y2=(e.clientY-rect.top)/zoom; measureStep=0; area.style.cursor="auto";
    measures.push({...tmpM}); tmpM={}; drawMeasures();
  }
});
document.getElementById('clearMeasures').onclick=function(){measures=[];drawMeasures();}
function drawMeasures(){
  let c=area.querySelector('canvas'); if(!c) return; let ctx=c.getContext('2d');
  updateZoom(); ctx.save(); ctx.lineWidth=5; ctx.strokeStyle="#16a";
  measures.forEach(m=>{
    ctx.beginPath(); ctx.moveTo(m.x1,m.y1); ctx.lineTo(m.x2,m.y2); ctx.stroke();
    let l=Math.sqrt(Math.pow(m.x2-m.x1,2)+Math.pow(m.y2-m.y1,2))/(window.scaleFactor||60);
    ctx.font="15px Arial"; ctx.fillStyle="#16a";
    ctx.fillText(l.toFixed(2)+" m",(m.x1+m.x2)/2,(m.y1+m.y2)/2-6);
  }); ctx.restore();
  showMeas();
}
function showMeas(){
  document.getElementById('measurements').innerHTML = 
    measures.map((m,i)=>`<span>Mitta ${i+1}: ${(Math.sqrt(Math.pow(m.x2-m.x1,2)+Math.pow(m.y2-m.y1,2))/(window.scaleFactor||60)).toFixed(2)} m <button onclick="delMeas(${i})">Poista</button></span><br>`).join("");
}
window.delMeas=function(i){ measures.splice(i,1); drawMeasures(); }

['productSelect','kaideFinish','handrailFinish','installOption','isStair','kaideLen','handLen'].forEach(id=>{
  document.getElementById(id).oninput=priceCalc;
});
function priceCalc() {
  // - Laske kaikki pituudet: mitat + tekstikentät
  let kaide = Number(document.getElementById('kaideLen').value)||0,
      hand = Number(document.getElementById('handLen').value)||0,
      stair = document.getElementById('isStair').value;
  let mSum = measures.map(m=>Math.sqrt(Math.pow(m.x2-m.x1,2)+Math.pow(m.y2-m.y1,2)) / (window.scaleFactor||60)).reduce((a,b)=>a+b,0);
  let totalKaide = kaide + (stair==='kyllä' ? mSum*1.2 : mSum);
  let product = document.getElementById('productSelect').value,
      finish = document.getElementById('kaideFinish').value,
      handFinish = document.getElementById('handrailFinish').value;
  let install = document.getElementById('installOption').value;
  // Hinnoittelu – laajenna omilla logiikoilla
  let priceKaide = product==='pinnakaide'?230:350;
  if(stair==='kyllä') priceKaide*=1.2;
  let priceHand = handFinish==='maalaus'?8:9;
  let hinta = totalKaide*priceKaide + hand*priceHand;
  let installCost = install==='kyllä'?(totalKaide*45):0;
  document.getElementById('pricebox').innerHTML = 
    `<b>Kaidepituus:</b> ${totalKaide.toFixed(2)} m<br>
    <b>Käsijohde:</b> ${hand.toFixed(2)} m<br>
    <b>Kokonaishinta:</b> ${hinta+installCost} € + alv 0`;
}
// Yhteystiedot ja “lähetä tarjous” nappi voit yhdistää backend POSTiin

document.getElementById('sendOfferBtn').onclick=function(){
  let n = document.getElementById('contactName').value,
      e = document.getElementById('contactEmail').value,
      p = document.getElementById('contactPhone').value,
      a = document.getElementById('contactAddr').value;
  if(!n||!e) return alert("Täytä kaikki yhteystiedot!");
  alert(`Tarjouspyyntö lähetetty:\n${n}\n${e}\n${p}\n${a}\n`);
}
