import PDFDocument from 'pdfkit';


interface BookingData {
  booking_id: string;
  service_type: string;
  pickup_location: string;
  dropoff_location: string;
  phone: string;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
  status: string;
  estimated_price?: number;
  created_at: string;
}

export class ReceiptGenerator {
  static generatePDF(booking: BookingData): any {
    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc
      .fillColor('#FFB800')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('🚕 EBULAN WINGS', { align: 'center' })
      .moveDown(0.3);

    doc
      .fillColor('#000000')
      .fontSize(14)
      .font('Helvetica')
      .text('Taxi & Cargo Services', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text('Addis Ababa, Ethiopia', { align: 'center' })
      .text('Phone: +251-XXX-XXXX', { align: 'center' })
      .text('Email: support@ebulanwings.com', { align: 'center' })
      .moveDown(1.5);

    // Receipt Title
    doc
      .fillColor('#FFB800')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('BOOKING RECEIPT', { align: 'center' })
      .moveDown(1);

    // Booking Details Box
    const boxTop = doc.y;
    doc
      .fillColor('#000000')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('BOOKING DETAILS', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica');

    const detailsY = doc.y;
    
    // Left column
    doc
      .font('Helvetica-Bold')
      .text('Booking ID:', 50, detailsY)
      .font('Helvetica')
      .fillColor('#FFB800')
      .text(booking.booking_id, 180, detailsY)
      .fillColor('#000000')
      .moveDown(0.8);

    doc
      .font('Helvetica-Bold')
      .text('Service Type:', 50)
      .font('Helvetica')
      .text(this.formatServiceType(booking.service_type), 180, doc.y - 12)
      .moveDown(0.8);

    doc
      .font('Helvetica-Bold')
      .text('Status:', 50)
      .font('Helvetica')
      .fillColor(this.getStatusColor(booking.status))
      .text(booking.status.toUpperCase(), 180, doc.y - 12)
      .fillColor('#000000')
      .moveDown(0.8);

    doc
      .font('Helvetica-Bold')
      .text('Date:', 50)
      .font('Helvetica')
      .text(new Date(booking.scheduled_date).toLocaleDateString(), 180, doc.y - 12)
      .moveDown(0.8);

    doc
      .font('Helvetica-Bold')
      .text('Time:', 50)
      .font('Helvetica')
      .text(booking.scheduled_time, 180, doc.y - 12)
      .moveDown(0.8);

    doc
      .font('Helvetica-Bold')
      .text('Phone:', 50)
      .font('Helvetica')
      .text(booking.phone, 180, doc.y - 12)
      .moveDown(1.2);

    // Location Details
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('LOCATION DETAILS', { underline: true })
      .moveDown(0.5);

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Pickup:', 50)
      .font('Helvetica')
      .text(booking.pickup_location, 180, doc.y - 12, { width: 350 })
      .moveDown(0.8);

    doc
      .font('Helvetica-Bold')
      .text('Drop-off:', 50)
      .font('Helvetica')
      .text(booking.dropoff_location, 180, doc.y - 12, { width: 350 })
      .moveDown(1.2);

    // Additional Notes
    if (booking.notes) {
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('ADDITIONAL NOTES', { underline: true })
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(booking.notes, { width: 500, align: 'justify' })
        .moveDown(1);
    }

    // Pricing (if available)
    if (booking.estimated_price) {
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('PRICING', { underline: true })
        .moveDown(0.5);

      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('Estimated Price:', 50)
        .fillColor('#FFB800')
        .text(`ETB ${booking.estimated_price.toFixed(2)}`, 180, doc.y - 14)
        .fillColor('#000000')
        .moveDown(1);
    }

    // Footer
    doc
      .moveDown(2)
      .fontSize(8)
      .fillColor('#666666')
      .text('Thank you for choosing Ebulan Wings!', { align: 'center' })
      .moveDown(0.3)
      .text('This is an automated receipt. No signature required.', { align: 'center' })
      .moveDown(0.5)
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

    // Border
    doc
      .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
      .stroke('#FFB800');

    doc.end();

    return doc;
  }

  static generateTXT(booking: BookingData): string {
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '                  🚕 EBULAN WINGS                           ',
      '              Taxi & Cargo Services                        ',
      '═══════════════════════════════════════════════════════════',
      '',
      '                   BOOKING RECEIPT                         ',
      '',
      '───────────────────────────────────────────────────────────',
      'BOOKING DETAILS',
      '───────────────────────────────────────────────────────────',
      `Booking ID:       ${booking.booking_id}`,
      `Service Type:     ${this.formatServiceType(booking.service_type)}`,
      `Status:           ${booking.status.toUpperCase()}`,
      `Date:             ${new Date(booking.scheduled_date).toLocaleDateString()}`,
      `Time:             ${booking.scheduled_time}`,
      `Phone:            ${booking.phone}`,
      '',
      '───────────────────────────────────────────────────────────',
      'LOCATION DETAILS',
      '───────────────────────────────────────────────────────────',
      `Pickup:           ${booking.pickup_location}`,
      `Drop-off:         ${booking.dropoff_location}`,
      ''
    ];

    if (booking.notes) {
      lines.push(
        '───────────────────────────────────────────────────────────',
        'ADDITIONAL NOTES',
        '───────────────────────────────────────────────────────────',
        booking.notes,
        ''
      );
    }

    if (booking.estimated_price) {
      lines.push(
        '───────────────────────────────────────────────────────────',
        'PRICING',
        '───────────────────────────────────────────────────────────',
        `Estimated Price:  ETB ${booking.estimated_price.toFixed(2)}`,
        ''
      );
    }

    lines.push(
      '───────────────────────────────────────────────────────────',
      'Thank you for choosing Ebulan Wings!',
      `Generated on: ${new Date().toLocaleString()}`,
      '═══════════════════════════════════════════════════════════'
    );

    return lines.join('\n');
  }

  private static formatServiceType(serviceType: string): string {
    const types: { [key: string]: string } = {
      taxi: 'Taxi Services',
      cargo: 'Cargo Transport',
      delivery: 'Delivery Services',
      airport: 'Airport Transfers'
    };
    return types[serviceType] || serviceType;
  }

  private static getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: '#FFA500',
      confirmed: '#4CAF50',
      'in-progress': '#2196F3',
      completed: '#4CAF50',
      cancelled: '#F44336'
    };
    return colors[status] || '#000000';
  }
}
