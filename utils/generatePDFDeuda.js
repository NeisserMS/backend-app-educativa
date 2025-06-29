const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Genera un PDF de deuda con QR de pago Yape (imagen local).
 * @param {Object} deuda - Objeto con los datos de la deuda.
 * @param {Function} callback - Callback que recibe (error, filePath).
 */
function generatePDFDeuda(deuda, callback) {
  const doc = new PDFDocument();
  const filePath = path.join(
    __dirname,
    "../documentos",
    `deuda-${deuda._id}.pdf`
  );
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // Encabezado
  doc
    .fontSize(18)
    .text("Municipalidad del Porvenir", { align: "center" })
    .moveDown();
  doc
    .fontSize(14)
    .text("Notificación de Deuda Pendiente", { align: "center" })
    .moveDown(2);

  // Detalles del ciudadano y deuda
  doc.fontSize(12).text(`DNI: ${deuda.dni}`);
  doc.text(`Contribuyente: ${deuda.nombres}`);
  doc.text(`Correo: ${deuda.correo}`);
  doc.text(`Concepto: ${deuda.concepto}`);
  doc.text(`Monto: S/. ${deuda.monto.toFixed(2)}`);
  doc.text(
    `Fecha de emisión: ${new Date(deuda.fechaEmision).toLocaleDateString()}`
  );
  doc.text(
    `Fecha de vencimiento: ${new Date(
      deuda.fechaVencimiento
    ).toLocaleDateString()}`
  );
  doc.text(`Observaciones: ${deuda.observaciones}`);
  doc.moveDown();

  // Mensaje
  doc.text(
    "Se le informa que posee una deuda pendiente. Puede regularizar el pago utilizando el siguiente código QR (Yape):",
    {
      align: "left",
    }
  );

  // Inserta la imagen QR local
  const qrPath = path.join(__dirname, "../img/maria.png");
  if (fs.existsSync(qrPath)) {
    doc.image(qrPath, {
      fit: [120, 120],
      align: "center",
      valign: "center",
    });
    doc.moveDown();
    doc
      .fontSize(10)
      .text("Escanee el QR con Yape para pagar.", { align: "center" });
  } else {
    doc
      .fontSize(10)
      .fillColor("red")
      .text("No se encontró la imagen QR.", { align: "center" });
  }

  doc.end();

  stream.on("finish", () => {
    callback(null, filePath);
  });

  stream.on("error", (err) => {
    callback(err, null);
  });
}

module.exports = generatePDFDeuda;
