
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

class BillingService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../../uploads');
  }

  async generateInvoicePDF(order) {
    try {
      // Crear el directorio de uploads si no existe
      await this.ensureUploadsDir();

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const filename = `invoice_${order.id}_${timestamp}.pdf`;
      const outputPath = path.join(this.uploadsDir, filename);
      const relativePath = `/uploads/${filename}`;

      // Crear el documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Crear stream de escritura
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Generar contenido de la factura
      await this.generateInvoiceContent(doc, order);

      // Finalizar el documento
      doc.end();

      // Esperar a que se complete la escritura
      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          console.log(`✅ Factura generada: ${outputPath}`);
          resolve(relativePath);
        });
        writeStream.on('error', reject);
      });

    } catch (error) {
      console.error('Error generando factura PDF:', error);
      throw error;
    }
  }

  async generateInvoiceContent(doc, order) {
    try {
      // Parsear los items del pedido
      const items = JSON.parse(order.items);
      
      // Encabezado
      this.addHeader(doc, order);
      
      // Información del cliente
      this.addCustomerInfo(doc, order);
      
      // Tabla de items
      this.addItemsTable(doc, items);
      
      // Totales
      this.addTotals(doc, order);
      
      // Pie de página
      this.addFooter(doc, order);

    } catch (error) {
      console.error('Error generando contenido de la factura:', error);
      throw error;
    }
  }

  addHeader(doc, order) {
    // Logo de la empresa (si existe)
    if (order.branch_logo_path) {
      try {
        const logoPath = path.join(__dirname, '../../../', order.branch_logo_path);
        doc.image(logoPath, 50, 50, { width: 80, height: 80 });
      } catch (error) {
        console.log('Logo no encontrado, continuando sin logo');
      }
    }

    // Título de la factura
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('FACTURA', 200, 50);

    // Información de la empresa
    doc.fontSize(12)
       .font('Helvetica')
       .text(order.branch_name || 'FastWings', 200, 80);

    if (order.branch_address) {
      doc.text(order.branch_address, 200, 95);
    }

    if (order.branch_phone) {
      doc.text(`Tel: ${order.branch_phone}`, 200, 110);
    }

    // Número de factura y fecha
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(`Factura #${order.id}`, 400, 50);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Fecha: ${new Date(order.created_at).toLocaleDateString('es-CO')}`, 400, 70);

    doc.moveDown(2);
  }

  addCustomerInfo(doc, order) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DEL CLIENTE', 50, 180);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Nombre: ${order.customer_name}`, 50, 200)
       .text(`Teléfono: ${order.customer_phone}`, 50, 215);

    if (order.notes) {
      doc.text(`Notas: ${order.notes}`, 50, 230);
    }

    doc.moveDown(2);
  }

  addItemsTable(doc, items) {
    const startY = 280;
    const colWidths = [50, 250, 80, 80, 80]; // Cantidad, Descripción, Precio Unit, Subtotal, Total

    // Encabezados de la tabla
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Cant.', 50, startY)
       .text('Descripción', 100, startY)
       .text('Precio Unit.', 350, startY)
       .text('Subtotal', 430, startY);

    // Línea separadora
    doc.moveTo(50, startY + 20)
       .lineTo(510, startY + 20)
       .stroke();

    let currentY = startY + 30;

    // Items de la tabla
    items.forEach((item, index) => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(item.quantity.toString(), 50, currentY)
         .text(item.name, 100, currentY)
         .text(`$${item.price.toFixed(2)}`, 350, currentY)
         .text(`$${item.subtotal.toFixed(2)}`, 430, currentY);

      currentY += 20;

      // Línea separadora entre items
      if (index < items.length - 1) {
        doc.moveTo(50, currentY)
           .lineTo(510, currentY)
           .stroke();
        currentY += 10;
      }
    });

    // Línea final de la tabla
    doc.moveTo(50, currentY)
       .lineTo(510, currentY)
       .stroke();

    doc.moveDown(1);
  }

  addTotals(doc, order) {
    const startY = 450;

    // Subtotal
    doc.fontSize(12)
       .font('Helvetica')
       .text('Subtotal:', 350, startY)
       .text(`$${order.total_amount.toFixed(2)}`, 430, startY);

    // IVA (19% en Colombia)
    const iva = order.total_amount * 0.19;
    doc.text('IVA (19%):', 350, startY + 20)
       .text(`$${iva.toFixed(2)}`, 430, startY + 20);

    // Total
    const total = order.total_amount + iva;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('TOTAL:', 350, startY + 40)
       .text(`$${total.toFixed(2)}`, 430, startY + 40);

    doc.moveDown(2);
  }

  addFooter(doc, order) {
    const startY = 550;

    doc.fontSize(10)
       .font('Helvetica')
       .text('Gracias por tu compra!', 50, startY)
       .text('FastWings - Sistema de Pedidos WhatsApp', 50, startY + 15)
       .text(`Factura generada el ${new Date().toLocaleString('es-CO')}`, 50, startY + 30);

    // Información adicional
    if (order.branch_name) {
      doc.text(`Sucursal: ${order.branch_name}`, 350, startY);
    }
  }

  async ensureUploadsDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch (error) {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      console.log(`📁 Directorio de uploads creado: ${this.uploadsDir}`);
    }
  }
}

module.exports = {
  generateInvoicePDF: async (order) => {
    const billingService = new BillingService();
    return await billingService.generateInvoicePDF(order);
  }
};
