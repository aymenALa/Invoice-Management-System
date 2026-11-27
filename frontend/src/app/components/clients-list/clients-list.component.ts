import { Component, OnInit } from '@angular/core';
import { ClientService } from '../../services/client.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ClientsListComponent implements OnInit {
  clients: any[] = [];
  clientForm: FormGroup;
  showClientForm = false;
  editingClientId: number | null = null;
  searchQuery = '';
  portalFilter: 'ALL' | 'ACTIVE' | 'BLOCKED' | 'PENDING' = 'ALL';
  isLoading = true;
  isSaving = false;

  constructor(
    private clientService: ClientService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadClients();
  }

  get filteredClients(): any[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.clients.filter(client => {
      const matchesQuery = !q
        || (client.name || '').toLowerCase().includes(q)
        || (client.email || '').toLowerCase().includes(q)
        || (client.phoneNumber || '').toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (this.portalFilter === 'ACTIVE') return client.portalAccountExists && client.portalAccessEnabled;
      if (this.portalFilter === 'BLOCKED') return client.portalAccountExists && !client.portalAccessEnabled;
      if (this.portalFilter === 'PENDING') return !client.portalAccountExists;
      return true;
    });
  }

  loadClients(): void {
    this.isLoading = true;
    this.clientService.getClients().subscribe({
      next: data => {
        this.clients = data || [];
        this.isLoading = false;
        this.loadClientPortalAccessStatuses();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadClientPortalAccessStatuses(): void {
    this.clients.forEach(client => {
      this.clientService.getClientPortalAccess(client.id).subscribe({
        next: status => {
          client.portalAccountExists = status.portalAccountExists;
          client.portalAccessEnabled = status.enabled;
        },
        error: () => {}
      });
    });
  }

  viewClientInvoices(clientId: number): void {
    this.router.navigate(['/clients', clientId, 'invoices']);
  }

  toggleClientForm(): void {
    this.showClientForm = !this.showClientForm;
    if (!this.showClientForm) {
      this.resetClientForm();
    }
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      Swal.fire({
        title: 'Validation Error',
        text: this.getClientValidationMessage(),
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (this.isSaving) return;
    this.isSaving = true;

    const operation = this.editingClientId
      ? this.clientService.updateClient(this.editingClientId, this.clientForm.value)
      : this.clientService.createClient(this.clientForm.value);

    operation.subscribe({
      next: () => {
        const action = this.editingClientId ? 'updated' : 'created';
        this.isSaving = false;
        this.resetClientForm();
        this.loadClients();
        Swal.fire({
          title: 'Success',
          text: `Client ${action} successfully.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      },
      error: error => {
        this.isSaving = false;
        const action = this.editingClientId ? 'updating' : 'creating';
        Swal.fire({
          title: 'Error',
          text: this.getErrorMessage(error, `An error occurred while ${action} the client.`),
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  editClient(client: any): void {
    this.editingClientId = client.id;
    this.showClientForm = true;
    this.clientForm.patchValue({
      name: client.name || '',
      email: client.email || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || ''
    });
  }

  cancelClientForm(): void {
    this.resetClientForm();
  }

  deleteClient(clientId: number): void {
    Swal.fire({
      title: 'Delete client?',
      text: 'Clients with existing invoices cannot be deleted until their invoices are removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Client',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.deleteClient(clientId).subscribe({
          next: () => {
            this.loadClients();
            Swal.fire('Deleted', 'The client has been deleted.', 'success');
          },
          error: error => {
            Swal.fire(
              'Cannot Delete Client',
              this.getErrorMessage(error, 'There was an error deleting the client.'),
              'error'
            );
          }
        });
      }
    });
  }

  generateAccessCode(client: any): void {
    this.clientService.generateClientAccessCode(client.id).subscribe({
      next: response => this.showAccessCodeModal(client, response),
      error: error => {
        Swal.fire({
          title: 'Error',
          text: this.getErrorMessage(error, 'Could not generate the client access code.'),
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  sendAccessCode(client: any): void {
    this.clientService.sendClientAccessCode(client.id).subscribe({
      next: response => {
        const isDemo = environment.demoMode;
        Swal.fire({
          title: isDemo ? 'Simulated Email Created' : 'Access Code Sent',
          html: this.getAccessCodeHtml(
            client,
            response,
            isDemo
              ? 'Simulated invitation email added to Demo Inbox (no external email was sent).'
              : 'The code was sent to the client email.'
          ),
          icon: 'success',
          confirmButtonText: 'OK'
        });
      },
      error: error => {
        Swal.fire({
          title: 'Send Failed',
          text: this.getErrorMessage(error, 'Could not send the access code. Check your email configuration.'),
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  toggleClientPortalAccess(client: any): void {
    const shouldBlock = client.portalAccessEnabled;
    const action = shouldBlock ? 'block' : 'unblock';

    Swal.fire({
      title: shouldBlock ? 'Block client access?' : 'Restore client access?',
      text: shouldBlock
        ? 'The client will no longer be able to log in or use the client portal.'
        : 'The client will be able to log in and use the client portal again.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: shouldBlock ? 'Block Access' : 'Unblock Access',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;

      const operation = shouldBlock
        ? this.clientService.blockClientPortalAccess(client.id)
        : this.clientService.unblockClientPortalAccess(client.id);

      operation.subscribe({
        next: status => {
          client.portalAccountExists = status.portalAccountExists;
          client.portalAccessEnabled = status.enabled;
          Swal.fire({
            title: 'Success',
            text: `Client portal access ${action}ed successfully.`,
            icon: 'success',
            confirmButtonText: 'OK'
          });
        },
        error: error => {
          Swal.fire({
            title: 'Error',
            text: this.getErrorMessage(error, `Could not ${action} client portal access.`),
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
    });
  }

  private showAccessCodeModal(client: any, invite: any): void {
    Swal.fire({
      title: 'Client Access Code',
      html: this.getAccessCodeHtml(client, invite, 'This code stays the same until you regenerate it.'),
      icon: 'info',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Copy Code',
      denyButtonText: 'Send Email',
      cancelButtonText: 'Regenerate'
    }).then(result => {
      if (result.isConfirmed) {
        this.copyAccessCode(invite.invitationCode);
      } else if (result.isDenied) {
        this.sendAccessCode(client);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.regenerateAccessCode(client);
      }
    });
  }

  private regenerateAccessCode(client: any): void {
    this.clientService.regenerateClientAccessCode(client.id).subscribe({
      next: response => this.showAccessCodeModal(client, response),
      error: error => {
        Swal.fire({
          title: 'Error',
          text: this.getErrorMessage(error, 'Could not regenerate the client access code.'),
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  private copyAccessCode(code: string): void {
    navigator.clipboard?.writeText(code).then(
      () => {
        Swal.fire({
          title: 'Copied',
          text: 'Access code copied to clipboard.',
          icon: 'success',
          timer: 1600,
          showConfirmButton: false
        });
      },
      () => {
        Swal.fire({
          title: 'Access Code',
          text: code,
          icon: 'info',
          confirmButtonText: 'OK'
        });
      }
    );
  }

  private getAccessCodeHtml(client: any, invite: any, note: string): string {
    return `
      <div style="text-align: center;">
        <p style="color: #F8FAFC; margin-bottom: 4px;"><strong>${client.name}</strong></p>
        <p style="color: #94A3B8; font-size: 13px;">${invite.email}</p>
        <div style="background: #0B0F19; border: 1px solid #263246; border-radius: 8px; color: #34D399; font-family: monospace; font-size: 26px; font-weight: 800; letter-spacing: 4px; margin: 16px 0; padding: 14px;">
          ${invite.invitationCode}
        </div>
        <p style="color: #94A3B8; font-size: 13px;">${note}</p>
        <p style="color: #818CF8; font-size: 12px; margin-top: 6px;">Client activation URL: /auth?accountType=client</p>
        <p style="color: #64748B; font-size: 12px; margin-top: 4px;">Expires at: ${invite.expiresAt}</p>
      </div>
    `;
  }

  private getClientValidationMessage(): string {
    const missingFields: string[] = [];
    if (this.clientForm.get('name')?.hasError('required')) {
      missingFields.push('enter the client name');
    } else if (this.clientForm.get('name')?.hasError('minlength')) {
      missingFields.push('enter a client name with at least 3 characters');
    }
    if (this.clientForm.get('email')?.hasError('required')) {
      missingFields.push('enter the client email');
    } else if (this.clientForm.get('email')?.hasError('email')) {
      missingFields.push('enter a valid client email');
    }
    if (missingFields.length === 0) {
      return 'Please fill out all required fields correctly.';
    }
    return `Please ${missingFields.join(', ')}.`;
  }

  private resetClientForm(): void {
    this.clientForm.reset();
    this.showClientForm = false;
    this.editingClientId = null;
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (typeof error?.error === 'string') return error.error;
    if (error?.error?.message) return error.error.message;
    if (error?.error?.error) return error.error.error;
    if (error?.error && typeof error.error === 'object') {
      return Object.values(error.error).join('\n');
    }
    return fallback;
  }
}
