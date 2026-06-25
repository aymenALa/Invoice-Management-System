import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { ClientService } from '../../services/client.service';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-client-invoices',
  templateUrl: './client-invoices.component.html',
  styleUrls: ['./client-invoices.component.css'],
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe]
})
export class ClientInvoicesComponent implements OnInit {
  client: any;
  invoices: any[] = [];
  clientId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private clientService: ClientService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientId = +id;
      this.loadClientData(this.clientId);
      this.loadClientInvoices(this.clientId);
    }
  }

  loadClientData(clientId: number): void {
    this.clientService.getClient(clientId).subscribe(
      data => this.client = data,
      error => console.error('Error loading client data', error)
    );
  }

  loadClientInvoices(clientId: number): void {
    this.invoiceService.getInvoices().subscribe(
      data => this.invoices = data.content.filter((invoice: any) => invoice.client?.id === clientId),
      error => console.error('Error loading client invoices', error)
    );
  }

  viewInvoice(invoiceId: number): void {
    this.router.navigate(['/invoices', invoiceId]);
  }

  downloadInvoicePdf(invoiceId: number): void {
    this.invoiceService.downloadInvoicePdf(invoiceId).subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url);
      },
      error => console.error('Error downloading PDF', error)
    );
  }

  downloadAllInvoicesPdf(): void {
    if (this.clientId) {
      this.invoiceService.downloadClientInvoicesPdf(this.clientId).subscribe(
        (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `client-${this.clientId}-invoices.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error => console.error('Error downloading all invoices PDF', error)
      );
    }
  }
}
