window.createOfferPDF = function(offerData){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(0,89,54); doc.rect(0,0,210,24,'F');
  // Logo base64 tarjoa src (helpoiten CDN:llä)
  // doc.addImage(logo_base64, "PNG", 9, 3, 16, 16);
  doc.setTextColor(255,255,255); doc.setFontSize(21);
  doc.text("Kymppikaide | Tarjous", 32, 16);

  doc.setTextColor(0,89,54); doc.setFontSize(13);
  doc.text(`Nimi: ${offerData.name||""}`,11,34);
  doc.text(`Email: ${offerData.email||""}`,11,40);
  doc.text(`Puh.: ${offerData.phone||""}`,11,46);
  doc.text(`Yritys: ${offerData.company||""}`,11,52);
  doc.text(`Projekti: ${offerData.project||""}`,11,58);

  doc.setTextColor(141,198,63); doc.setFontSize(15);
  doc.text('Tuotteet:',12,68);

  doc.setTextColor(0,89,54); doc.setFontSize(12);
  doc.text(`Kaide: ${offerData.product}, pituus: ${offerData.kaidePituus} m`, 12, 75);
  doc.text(`Käsijohde: ${offerData.handrailFinish}, pituus: ${offerData.handrailPituus} m`, 12, 81);

  doc.text('AI-mitat:', );
  offerData.aiResults.forEach((r,i)=>doc.text(`${i+1}. ${r.type}: ${r.length.toFixed(2)} m`,16,95+i*6));
  let aiOffset = 95 + offerData.aiResults.length*6;
  doc.text('Manuaalimitat:', 12, aiOffset+6);
  offerData.manualResults.forEach((r,i)=>doc.text(`${i+1}. ${r.type}: ${r.length.toFixed(2)} m`, 16, aiOffset+14+i*6));
  let fileOffset = aiOffset+22+offerData.manualResults.length*6;
  doc.setTextColor(147,149,152);
  doc.text(`Liitteet: ${offerData.fileNames.join(", ")}`, 12, fileOffset);
  doc.setTextColor(0,89,54); doc.setFontSize(14);
  doc.text(`Tarjous yhteensä: ${offerData.price.toFixed(2)} € + alv 25.5`, 12, fileOffset+8);
  doc.save('Tarjous_Kymppikaide.pdf');
};
