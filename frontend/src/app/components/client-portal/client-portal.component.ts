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

  loadPortalData(): void {
    this.clientPortalService.getProfile().subscribe({
      next: client => {
        this.client = client;
        this.patchProfileForm(client);
      },
      error: error => this.handleAuthError(error)
    });

    this.clientPortalService.getInvoices().subscribe({
      next: invoices => this.invoices = invoices,
      error: error => this.handleAuthError(error)
    });
  }

  downloadInvoicePdf(invoiceId: number): void {
    this.clientPortalService.downloadInvoicePdf(invoiceId).subscribe(blob => this.openBlob(blob));
  }

  downloadAllInvoicesPdf(): void {
    this.clientPortalService.downloadAllInvoicesPdf().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `client-invoices.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
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
        this.errorMessage = error?.error?.message || 'Could not update your profile.';
      }
    });
  }

  logout(): void {
    this.clientPortalService.logout();
    this.router.navigate(['/auth']);
  }

  private openBlob(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  }

  private patchProfileForm(client: any): void {
    if (!client) {
      return;
    }

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
