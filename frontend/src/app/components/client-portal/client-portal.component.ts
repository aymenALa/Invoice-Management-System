import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientPortalService } from '../../services/client-portal.service';

@Component({
  selector: 'app-client-portal',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './client-portal.component.html',
  styleUrls: ['./client-portal.component.css']
})
export class ClientPortalComponent implements OnInit {
  client: any;
  invoices: any[] = [];
  errorMessage = '';
  successMessage = '';
  isEditingProfile = false;
  isLoading = true;
  profileForm: FormGroup;

  constructor(
    private clientPortalService: ClientPortalService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phoneNumber: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadPortalData();
  }

  get paidTotal(): number {
    return this.invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  }

  get outstandingTotal(): number {
    return this.invoices
      .filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
      .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  }

  loadPortalData(): void {
    this.isLoading = true;
    this.clientPortalService.getProfile().subscribe({
      next: client => {
        this.client = client;
        this.patchProfileForm(client);
      },
      error: error => this.handleAuthError(error)
    });

    this.clientPortalService.getInvoices().subscribe({
      next: invoices => {
        this.invoices = invoices || [];
        this.isLoading = false;
      },
      error: error => {
        this.isLoading = false;
        this.handleAuthError(error);
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

  downloadInvoicePdf(invoice: any): void {
    const id = typeof invoice === 'number' ? invoice : invoice.id;
    const invNum = typeof invoice === 'number' ? String(invoice) : (invoice.invoiceNumber || String(id));
    this.clientPortalService.downloadInvoicePdf(id).subscribe({
      next: blob => this.saveBlob(blob, `Invoice-${invNum}.pdf`),
      error: error => {
        if (error?.status === 401) {
          this.handleAuthError(error);
        } else {
          this.errorMessage = 'Could not download the invoice PDF.';
        }
      }
    });
  }

  downloadAllInvoicesPdf(): void {
    if (this.invoices.length === 0) return;
    this.clientPortalService.downloadAllInvoicesPdf().subscribe({
      next: blob => this.saveBlob(blob, 'client-invoices.pdf'),
      error: error => {
        if (error?.status === 401) {
          this.handleAuthError(error);
        } else {
          this.errorMessage = 'Could not download the statement PDF.';
        }
      }
    });
  }

  editProfile(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.patchProfileForm(this.client);
    this.isEditingProfile = true;
  }

  cancelEditProfile(): void {
    this.isEditingProfile = false;
    this.patchProfileForm(this.client);
  }

  saveProfile(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.errorMessage = 'Please enter a name with at least 3 characters.';
      return;
    }

    this.clientPortalService.updateProfile(this.profileForm.value).subscribe({
      next: client => {
        this.client = client;
        this.patchProfileForm(client);
        this.isEditingProfile = false;
        this.successMessage = 'Profile updated successfully.';
      },
      error: error => {
        if (error?.status === 401) {
          this.handleAuthError(error);
        } else {
          this.errorMessage = error?.error?.message || 'Could not update your profile.';
        }
      }
    });
  }

  logout(): void {
    this.clientPortalService.logout();
    this.router.navigate(['/auth'], { queryParams: { accountType: 'client' } });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private patchProfileForm(client: any): void {
    if (!client) return;
    this.profileForm.patchValue({
      name: client.name || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || ''
    });
  }

  private handleAuthError(error: any): void {
    this.errorMessage = error?.error?.message || 'Your client session is invalid or expired.';
    this.clientPortalService.logout();
    this.router.navigate(['/auth'], {
      queryParams: {
        accountType: 'client',
        clientMessage: this.errorMessage
      }
    });
  }
}
