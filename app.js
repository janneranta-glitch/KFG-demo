const pdfDiv = document.getElementById('pdf-esikatselu');
let analyzedData = [];

document.getElementById('pdflataus').onchange = async function(e){
  pdfDiv.innerHTML = ""; analyzedData = [];
  for(const file of e.target.files){
    const fr = new FileReader();
    fr.onload = async function(evt){
      const typedarray = new Uint8Array(evt.target.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      for(let pageNum=1; pageNum<=pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({scale:1.25});
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({canvasContext: ctx, viewport: viewport}).promise;
        pdfDiv.appendChild(canvas);

        // --- AI/REST-analyysi backendille ---
        let imgdata = canvas.toDataURL("image/png");
        // HUOM: Tässä API endpoint! Korvaa alla oikealla osoitteella!
        let resp = await fetch('https://OMA-BACKENDI/analyze-pdf', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ image: imgdata })
        });
        let kaideres = await resp.json(); // odotetaan {lines: [{x1,y1,x2,y2,type}, ...]}
        analyzedData.push({canvas, kaideres});
        drawAiOverlay(canvas, kaideres.lines);
        // Luo editointipaikka (voit laajentaa drag, select, delete)
        listKaiteet(kaideres.lines, canvas);
      }
    };
    fr.readAsArrayBuffer(file);
  }
};

// AI-tulosten piirto PDF canvasin päälle
function drawAiOverlay(canvas, lines){
  const ctx = canvas.getContext('2d');
  lines.forEach(line=>{
    ctx.beginPath();
    ctx.moveTo(line.x1,line.y1); ctx.lineTo(line.x2,line.y2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = (line.type=="kaide"?"blue":"red");
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Pituuslabel
    let dist = Math.sqrt(Math.pow(line.x2-line.x1,2)+Math.pow(line.y2-line.y1,2))/70; // Skaalaus DEMO
    ctx.font="15px Arial";
    ctx.fillStyle="#333";
    ctx.fillText(dist.toFixed(2)+'m',(line.x1+line.x2)/2,(line.y1+line.y2)/2-8);
  });
}

// Kaide/käsijohde editointi
function listKaiteet(lines, canvas){
  let div = document.createElement('div');
  div.innerHTML = "<h4>Tunnistetut kaiteet/käsijohteet</h4>";
  lines.forEach((line,i)=>{
    div.innerHTML += `<div>
      <span style="color:${line.type=="kaide"?"blue":"red"}"><b>${line.type}</b></span>
      Pituus: <input type="number" value="${Math.sqrt(Math.pow(line.x2-line.x1,2)+Math.pow(line.y2-line.y1,2))/70}" step="0.01"> m
      <button onclick="deleteKaide(${i})">Poista</button>
    </div>`;
  });
  document.getElementById('kaide-edit').appendChild(div);
  // Mitat voi muuttaa suoraan – toteuta pituuslaskenta tallentamalla uudet arvot
  // Poisto: käynnistä deleteKaide(i)
}
window.deleteKaide = function(idx){
  // Poista valittu viiva analyysidatasta
  analyzedData.forEach(ad=>{
    ad.kaideres.lines.splice(idx,1);
    drawAiOverlay(ad.canvas, ad.kaideres.lines);
  });
  document.getElementById('kaide-edit').innerHTML="";
};

// Hinnanlaskenta (voit päivittää logiikkaa config.js:llä)
function priceCalc(){
  let yht=0, txt="";
  analyzedData.forEach(ad=>{
    ad.kaideres.lines.forEach(line=>{
      let pituus = Math.sqrt(Math.pow(line.x2-line.x1,2)+Math.pow(line.y2-line.y1,2))/70;
      let hinta = (line.type=="kaide" ? 230 : 5); // PINNAKAIDE ja KÄSIJOHDE DEMO
      yht += pituus * hinta;
      txt += `<span style="color:${line.type=="kaide"?"blue":"red"}">${line.type}</span>: ${pituus.toFixed(2)} m x ${hinta} €/m = ${ (pituus*hinta).toFixed(2) }<br>`;
    });
  });
  document.getElementById("pricebox").innerHTML=`<div class="pricebox"> ${txt} <br><b>Yhteensä: ${yht.toFixed(2)} € + alv 0</b></div>`;
}
setInterval(priceCalc,1500); // päivitys automaattisesti

// 3D-esikatselu (voit laajentaa threeview.js logiikkaa)
document.getElementById("preview-3d").onclick=function(){
  let canvas=document.getElementById("three-canvas");
  let renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setClearColor(0xe6e9ef);
  let scene = new THREE.Scene();
  let camera = new THREE.PerspectiveCamera(45, 700/350, 0.1, 1000);
  camera.position.set(2,1.2,5);
  let ambientLight = new THREE.AmbientLight(0xffffff,1.1); scene.add(ambientLight);
  // Demo: render AI-tunnistetut kaideviivat 3D:ssä
  analyzedData.forEach(ad=>{
    ad.kaideres.lines.forEach(line=>{
      let zz = line.type=="kaide" ? 0 : 0.12;
      let geo = new THREE.BoxGeometry( Math.sqrt(Math.pow(line.x2-line.x1,2)+Math.pow(line.y2-line.y1,2))/150, 0.04, zz ? 0.04 : 0.01 );
      let mat = new THREE.MeshStandardMaterial({color:line.type=="kaide"?0x3333cc:0xdd1111});
      let viiva = new THREE.Mesh(geo,mat);
      viiva.position.set(0,1.0,(line.type=="kaide"?0:0.4));
      scene.add(viiva);
    });
  });
  renderer.render(scene,camera);
};
