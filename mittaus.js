export function mittaaJaMerkitse(canvas, manualMeasures, ctx, scaleFactor, zoom, panX, panY){
  manualMeasures.forEach(m=>{
    ctx.save();
    ctx.strokeStyle = m.type==="kaide"?"#ea4242":"#c2e91c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(m.x1*zoom+panX,m.y1*zoom+panY); ctx.lineTo(m.x2*zoom+panX,m.y2*zoom+panY); ctx.stroke();
    let dist = laskeViivanPituus(m.x1,m.y1,m.x2,m.y2,scaleFactor);
    let kulma = laskeNousukulma(m);
    ctx.font="13px Arial"; ctx.fillStyle="#ea4242";
    ctx.fillText(`${dist.toFixed(2)} m ${kulma.toFixed(1)}°`,(m.x1+m.x2)*zoom/2+panX,(m.y1+m.y2)*zoom/2+panY);
    ctx.restore();
  });
}
mittaaJaMerkitse.start = function(canvas, type){
  let step=0, tmp={type};
  canvas.onclick=function(e){
    let rect=canvas.getBoundingClientRect();
    if(step===0){ tmp.x1=(e.clientX-rect.left-panX)/zoom; tmp.y1=(e.clientY-rect.top-panY)/zoom; step=1; }
    else if(step===1){ tmp.x2=(e.clientX-rect.left-panX)/zoom; tmp.y2=(e.clientY-rect.top-panY)/zoom;
      tmp.length=laskeViivanPituus(tmp.x1,tmp.y1,tmp.x2,tmp.y2,scaleFactor);
      tmp.angle=laskeNousukulma(tmp);
      manualMeasures.push({...tmp}); step=0; canvas.onclick=null; drawAllLayers();
    }
  }
}
export function laskeViivanPituus(x1,y1,x2,y2,scale){ return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2))/scale;}
export function laskeNousukulma(m){ return Math.abs(Math.atan2(m.y2-m.y1,m.x2-m.x1)*180/Math.PI);}
