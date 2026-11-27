import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DemoPdfService {
  async generateInvoicePdf(invoice: any, issuer?: { firstName?: string; lastName?: string; username?: string; email?: string }): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;

    // Top Indigo Accent Bar
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, 32, pageWidth - margin * 2, 5, 'F');

    // Brand Wordmark left
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, 54, 34, 34, 6, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('IMS', margin + 17, 75, { align: 'center' });

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text('INVOICE MANAGEMENT SYSTEM', margin + 44, 68);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Browser Portfolio Demo Document', margin + 44, 80);

    // INVOICE title right
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('INVOICE', pageWidth - margin, 68, { align: 'right' });

    doc.setTextColor(79, 70, 229);
    doc.setFontSize(12);
    doc.text(`#${invoice.invoiceNumber || ''}`, pageWidth - margin, 86, { align: 'right' });

    doc.setTextColor(...this.statusRgb(invoice.status));
    doc.setFontSize(9);
    doc.text(`STATUS: ${invoice.status || ''}`, pageWidth - margin, 101, { align: 'right' });

    // Issuer & Client Boxes
    const boxY = 128;
    const boxW = (pageWidth - margin * 2 - 14) / 2;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, boxY, boxW, 84, 'FD');
    doc.rect(margin + boxW + 14, boxY, boxW, 84, 'D');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ISSUED BY', margin + 12, boxY + 18);
    doc.text('BILLED TO', margin + boxW + 26, boxY + 18);

    const issuerName = `${issuer?.firstName || ''} ${issuer?.lastName || ''}`.trim() || issuer?.username || 'Business Workspace';
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(issuerName, margin + 12, boxY + 35);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (issuer?.email) {
      doc.text(issuer.email, margin + 12, boxY + 50);
    }

    const client = invoice.client || {};
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(String(client.name || 'Unassigned Client').slice(0, 42), margin + boxW + 26, boxY + 35);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    if (client.address) {
      const lines = doc.splitTextToSize(String(client.address), boxW - 24);
      doc.text(lines.slice(0, 2), margin + boxW + 26, boxY + 49);
    }
    if (client.email) {
      doc.text(String(client.email), margin + boxW + 26, boxY + 70);
    }

    // Details Table Header
    const tableY = 236;
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, tableY, pageWidth - margin * 2, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('INVOICE NUMBER', margin + 10, tableY + 16);
    doc.text('ISSUE DATE', margin + 165, tableY + 16);
    doc.text('DUE DATE', margin + 255, tableY + 16);
    doc.text('STATUS', margin + 350, tableY + 16);
    doc.text('AMOUNT', pageWidth - margin - 10, tableY + 16, { align: 'right' });

    // Details Row
    const rowY = tableY + 26;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, rowY + 28, pageWidth - margin, rowY + 28);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(String(invoice.invoiceNumber || ''), margin + 10, rowY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(String(invoice.issueDate || '-'), margin + 165, rowY + 18);
    doc.text(String(invoice.dueDate || '-'), margin + 255, rowY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.statusRgb(invoice.status));
    doc.text(String(invoice.status || ''), margin + 350, rowY + 18);
    doc.setTextColor(15, 23, 42);
    doc.text(this.formatCurrency(invoice.totalAmount), pageWidth - margin - 10, rowY + 18, { align: 'right' });

    // Total Box
    const totalY = rowY + 54;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(pageWidth - margin - 200, totalY, 200, 56, 'FD');
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL AMOUNT DUE', pageWidth - margin - 14, totalY + 20, { align: 'right' });
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(17);
    doc.text(this.formatCurrency(invoice.totalAmount), pageWidth - margin - 14, totalY + 42, { align: 'right' });

    // Footer
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Generated locally in browser by Invoice Management System (Portfolio Demo)', pageWidth / 2, totalY + 104, { align: 'center' });

    return doc.output('blob');
  }

  async generateClientInvoicesPdf(client: any, invoices: any[]): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;

    doc.setFillColor(79, 70, 229);
    doc.rect(margin, 32, pageWidth - margin * 2, 5, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('CLIENT INVOICE STATEMENT', margin, 68);

    doc.setTextColor(79, 70, 229);
    doc.setFontSize(11);
    doc.text(String(client?.name || 'Client'), pageWidth - margin, 64, { align: 'right' });
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (client?.email) {
      doc.text(String(client.email), pageWidth - margin, 78, { align: 'right' });
    }

    let y = 110;
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('INVOICE #', margin + 10, y + 15);
    doc.text('ISSUE DATE', margin + 165, y + 15);
    doc.text('DUE DATE', margin + 255, y + 15);
    doc.text('STATUS', margin + 350, y + 15);
    doc.text('AMOUNT', pageWidth - margin - 10, y + 15, { align: 'right' });
    y += 24;

    let totalCents = 0;
    for (let i = 0; i < invoices.length; i++) {
      if (y > 760) {
        doc.addPage();
        y = 48;
      }
      const inv = invoices[i];
      if (inv.status !== 'CANCELLED') {
        totalCents += Math.round(Number(inv.totalAmount || 0) * 100);
      }
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');
      }
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(String(inv.invoiceNumber || ''), margin + 10, y + 15);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(String(inv.issueDate || '-'), margin + 165, y + 15);
      doc.text(String(inv.dueDate || '-'), margin + 255, y + 15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.statusRgb(inv.status));
      doc.text(String(inv.status || ''), margin + 350, y + 15);
      doc.setTextColor(15, 23, 42);
      doc.text(this.formatCurrency(inv.totalAmount), pageWidth - margin - 10, y + 15, { align: 'right' });
      y += 24;
    }

    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(
      `Active Statement Total (${invoices.length} invoices): ${this.formatCurrency(totalCents / 100)}`,
      pageWidth - margin,
      y + 24,
      { align: 'right' }
    );

    return doc.output('blob');
  }

  private statusRgb(status: string): [number, number, number] {
    switch (status) {
      case 'PAID': return [4, 120, 87];
      case 'OVERDUE': return [185, 28, 28];
      case 'SENT': return [79, 70, 229];
      case 'DRAFT': return [180, 83, 9];
      default: return [71, 85, 105];
    }
  }

  private formatCurrency(amount: number): string {
    const val = Number(amount || 0);
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
