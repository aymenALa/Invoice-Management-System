import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../../services/invoice.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, CurrencyPipe]
})
export class InvoiceListComponent implements OnInit {
  invoices: any[] = [];
  isLoading = true;
  errorMessage = '';

  searchQuery = '';
  statusFilter = '';
  sortBy = 'issueDate';
  sortDir: 'asc' | 'desc' = 'desc';
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  readonly statuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

  constructor(private invoiceService: InvoiceService, public router: Router) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.invoiceService.getInvoices({
      page: this.page,
      size: this.size,
      sortBy: this.sortBy,
      sortDir: this.sortDir,
      invoiceNumber: this.searchQuery.trim() || undefined,
      status: this.statusFilter || undefined
    }).subscribe({
      next: response => {
        if (Array.isArray(response)) {
          this.invoices = response;
          this.totalElements = response.length;
          this.totalPages = 1;
        } else if (response && Array.isArray(response.content)) {
          this.invoices = response.content;
          this.totalElements = response.totalElements ?? response.content.length;
          this.totalPages = response.totalPages ?? 1;
        } else {
          this.invoices = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Could not load invoices. Please try again.';
      }
    });
  }

  applyFilters(): void {
    this.page = 0;
    this.loadInvoices();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.sortBy = 'issueDate';
    this.sortDir = 'desc';
    this.page = 0;
    this.loadInvoices();
  }

  changePage(newPage: number): void {
    if (newPage < 0 || (this.totalPages > 0 && newPage >= this.totalPages)) {
      return;
    }
    this.page = newPage;
    this.loadInvoices();
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

  deleteInvoice(id: number): void {
    Swal.fire({
      title: 'Delete invoice?',
      text: 'This action permanently removes the invoice record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Invoice',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.invoiceService.deleteInvoice(id).subscribe({
          next: () => {
            this.loadInvoices();
            Swal.fire('Deleted', 'The invoice has been deleted.', 'success');
          },
          error: error => {
            const msg = error?.error?.message || error?.error?.error || 'There was an error deleting the invoice.';
            Swal.fire('Delete Failed', msg, 'error');
          }
        });
      }
    });
  }

  downloadInvoicePdf(invoice: any): void {
    const id = typeof invoice === 'number' ? invoice : invoice.id;
    const invoiceNum = typeof invoice === 'number' ? String(invoice) : (invoice.invoiceNumber || String(id));
    this.invoiceService.downloadInvoicePdf(id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${invoiceNum}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        Swal.fire('Download Failed', 'Could not generate the invoice PDF.', 'error');
      }
    });
  }
}
