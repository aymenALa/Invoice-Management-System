import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css'],
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, RouterModule]
})
export class InvoiceDetailComponent implements OnInit {
  invoice: any;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService,
    public router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(+id);
    }
  }

  loadInvoice(id: number): void {
    this.isLoading = true;
    this.invoiceService.getInvoice(id).subscribe({
      next: data => {
        this.invoice = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Invoice not found or access denied.';
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

  downloadPdf(): void {
    if (!this.invoice?.id) return;
    this.invoiceService.downloadInvoicePdf(this.invoice.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${this.invoice.invoiceNumber || this.invoice.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        Swal.fire('Download Failed', 'Could not generate PDF for this invoice.', 'error');
      }
    });
  }

  deleteInvoice(): void {
    if (!this.invoice?.id) return;
    Swal.fire({
      title: 'Delete invoice?',
      text: `Permanently delete invoice ${this.invoice.invoiceNumber}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.invoiceService.deleteInvoice(this.invoice.id).subscribe({
          next: () => {
            this.router.navigate(['/invoices']);
          },
          error: error => {
            Swal.fire('Error', error?.error?.message || 'Could not delete invoice.', 'error');
          }
        });
      }
    });
  }
}
