export function filterAiLines(lines){
  return lines.filter(l=>l.type==='kaide'||l.type==='käsijohde')
    .map(l=>({...l, angle: laskeNousukulma(l) }));
}
export function applyAiLabels(canvas, lines, ctx, scaleFactor, zoom, panX, panY){
  lines.forEach(l=>{
    ctx.save();
    ctx.strokeStyle = l.type==="kaide"?"#22f":"#29c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(l.x1*zoom+panX,l.y1*zoom+panY); ctx.lineTo(l.x2*zoom+panX,l.y2*zoom+panY); ctx.stroke();
    ctx.font="15px Arial"; ctx.fillStyle="#22f";
    ctx.fillText(`${l.length.toFixed(2)} m ${(l.angle).toFixed(1)}°`,(l.x1+l.x2)*zoom/2+panX,(l.y1+l.y2)*zoom/2+panY);
    ctx.restore();
  });
}
