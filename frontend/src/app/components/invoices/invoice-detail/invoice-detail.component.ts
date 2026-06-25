import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css'],
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, RouterModule]
})
export class InvoiceDetailComponent implements OnInit {
  invoice: any;

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService,
    public router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(+id);
    }
  }

  loadInvoice(id: number): void {
    this.invoiceService.getInvoice(id).subscribe(
      data => {
        this.invoice = data;
        console.log('Loaded invoice:', this.invoice);
      },
      error => console.error('Error loading invoice', error)
    );
  }


  downloadPdf(): void {
    if (this.invoice && this.invoice.id) {
      this.invoiceService.downloadInvoicePdf(this.invoice.id).subscribe(
        (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url);
        },
        error => console.error('Error downloading PDF', error)
      );
    }
  }

  deleteInvoice(): void {
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.invoiceService.deleteInvoice(this.invoice.id).subscribe(
        () => {
          this.router.navigate(['/invoices']);
        },
        error => console.error('Error deleting invoice', error)
      );
    }
  }
}
