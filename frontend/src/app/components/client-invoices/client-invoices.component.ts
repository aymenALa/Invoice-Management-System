import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { ClientService } from '../../services/client.service';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-client-invoices',
  templateUrl: './client-invoices.component.html',
  styleUrls: ['./client-invoices.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe]
})
export class ClientInvoicesComponent implements OnInit {
  client: any;
  invoices: any[] = [];
  clientId: number | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientId = +id;
      this.loadClientData(this.clientId);
      this.loadClientInvoices(this.clientId);
    }
  }

  loadClientData(clientId: number): void {
    this.clientService.getClient(clientId).subscribe({
      next: data => this.client = data,
      error: () => {}
    });
  }

  loadClientInvoices(clientId: number): void {
    this.isLoading = true;
    this.invoiceService.getClientInvoices(clientId).subscribe({
      next: data => {
        this.invoices = data || [];
        this.isLoading = false;
      },
      error: () => {
        this.invoices = [];
        this.isLoading = false;
      }
    });
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'PAID': return 'ims-badge ims-badge-paid';
      case 'SENT': return 'ims-badge ims-badge-sent';
      case 'OVERDUE': return 'ims-badge ims-badge-overdue';
      case 'DRAFT': return 'ims-badge ims-badge-draft';
      default: return 'ims-badge ims-badge-cancelled';
    }
  }

  viewInvoice(invoiceId: number): void {
    this.router.navigate(['/invoices', invoiceId]);
  }

  downloadInvoicePdf(invoice: any): void {
    this.invoiceService.downloadInvoicePdf(invoice.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        Swal.fire('Error', 'Could not download invoice PDF.', 'error');
      }
    });
  }

  downloadAllInvoicesPdf(): void {
    if (!this.clientId || this.invoices.length === 0) return;
    this.invoiceService.downloadClientInvoicesPdf(this.clientId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `client-${this.clientId}-invoices.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        Swal.fire('Error', 'Could not download client statement PDF.', 'error');
      }
    });
  }
}
