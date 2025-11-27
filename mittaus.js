window.measureAddStart = function(type){
  window.measureType = type;
  let step=0, tmp={type:type};
  window.pdfCanvas.onclick=function(e){
    let rect=window.pdfCanvas.getBoundingClientRect();
    if(step===0){
      tmp.x1=(e.clientX-rect.left-window.pdfState.panX)/window.pdfState.zoom;
      tmp.y1=(e.clientY-rect.top-window.pdfState.panY)/window.pdfState.zoom;
      step=1;
    }else if(step===1){
      tmp.x2=(e.clientX-rect.left-window.pdfState.panX)/window.pdfState.zoom;
      tmp.y2=(e.clientY-rect.top-window.pdfState.panY)/window.pdfState.zoom;
      tmp.length=Math.sqrt(Math.pow(tmp.x1-tmp.x2,2)+Math.pow(tmp.y1-tmp.y2,2))/window.pdfState.scaleFactor;
      window.manualMeasures.push({...tmp});
      step=0; window.pdfCanvas.onclick=null;
      window.drawLayers();
      window.showMeasures();
    }
  };
};
window.showMeasures = function(){
  let html = window.manualMeasures.map((m,i)=>`<span>${m.type} ${i+1}: ${m.length.toFixed(2)} m <button onclick="removeMeasure(${i})">Poista</button></span>`).join(" ");
  document.getElementById('measurements').innerHTML = html;
};
window.removeMeasure = function(i){ window.manualMeasures.splice(i,1); window.drawLayers(); window.showMeasures(); };
