import { Component, OnInit } from '@angular/core';
import { ClientService } from '../../services/client.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ClientsListComponent implements OnInit {
  clients: any[] = [];
  clientForm: FormGroup;
  showClientForm = false;
  editingClientId: number | null = null;

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

  loadClients(): void {
    this.clientService.getClients().subscribe(
      data => {
        this.clients = data;
        this.loadClientPortalAccessStatuses();
      },
      error => console.error('Error loading clients', error)
    );
  }

  loadClientPortalAccessStatuses(): void {
    this.clients.forEach(client => {
      this.clientService.getClientPortalAccess(client.id).subscribe(
        status => {
          client.portalAccountExists = status.portalAccountExists;
          client.portalAccessEnabled = status.enabled;
        },
        error => console.error('Error loading client portal access status', error)
      );
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

    const operation = this.editingClientId
      ? this.clientService.updateClient(this.editingClientId, this.clientForm.value)
      : this.clientService.createClient(this.clientForm.value);

    operation.subscribe(
      () => {
        const action = this.editingClientId ? 'updated' : 'created';
        this.resetClientForm();
        this.loadClients();

        Swal.fire({
          title: 'Success',
          text: `Client ${action} successfully.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      },
      error => {
        const action = this.editingClientId ? 'updating' : 'creating';

        Swal.fire({
          title: 'Error',
          text: this.getErrorMessage(error, `An error occurred while ${action} the client.`),
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
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
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#27b397',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete Client !'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientService.deleteClient(clientId).subscribe(
          () => {
            console.log('Client deleted successfully');
            this.loadClients(); // Refresh the list of clients
          },
          error => console.error('Error deleting client', error)
        );
        Swal.fire(
          'Deleted!',
          'The client has been deleted.',
          'success'
        );
      }
    });
  }

  generateAccessCode(client: any): void {
    this.clientService.generateClientAccessCode(client.id).subscribe(
      response => this.showAccessCodeModal(client, response),
      error => {
        Swal.fire({
          title: 'Error',
          text: this.getErrorMessage(error, 'Could not generate the client access code.'),
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
  }

  sendAccessCode(client: any): void {
    this.clientService.sendClientAccessCode(client.id).subscribe(
      response => {
        Swal.fire({
          title: 'Access Code Sent',
          html: this.getAccessCodeHtml(client, response, 'The code was sent to the client email.'),
          icon: 'success',
          confirmButtonText: 'OK'
        });
      },
      error => {
        Swal.fire({
          title: 'Send Failed',
          text: this.getErrorMessage(error, 'Could not send the access code. Check your email configuration.'),
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
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
      confirmButtonColor: shouldBlock ? '#d33' : '#27b397',
      cancelButtonColor: '#6b7280',
      confirmButtonText: shouldBlock ? 'Block Access' : 'Unblock Access'
    }).then(result => {
      if (!result.isConfirmed) {
        return;
      }

      const operation = shouldBlock
        ? this.clientService.blockClientPortalAccess(client.id)
        : this.clientService.unblockClientPortalAccess(client.id);

      operation.subscribe(
        status => {
          client.portalAccountExists = status.portalAccountExists;
          client.portalAccessEnabled = status.enabled;

          Swal.fire({
            title: 'Success',
            text: `Client portal access ${action}ed successfully.`,
            icon: 'success',
            confirmButtonText: 'OK'
          });
        },
        error => {
          Swal.fire({
            title: 'Error',
            text: this.getErrorMessage(error, `Could not ${action} client portal access.`),
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      );
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
    this.clientService.regenerateClientAccessCode(client.id).subscribe(
      response => this.showAccessCodeModal(client, response),
      error => {
        Swal.fire({
          title: 'Error',
          text: this.getErrorMessage(error, 'Could not regenerate the client access code.'),
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
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
        <p><strong>${client.name}</strong></p>
        <p>${invite.email}</p>
        <div style="background: #f0f7f5; border: 1px solid #d7ece7; border-radius: 8px; color: #1a8870; font-size: 28px; font-weight: 800; letter-spacing: 4px; margin: 16px 0; padding: 14px;">
          ${invite.invitationCode}
        </div>
        <p style="color: #4b5563; font-size: 14px;">${note}</p>
        <p style="color: #6b7280; font-size: 13px;">Expires at: ${invite.expiresAt}</p>
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
    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.error?.error) {
      return error.error.error;
    }

    if (error?.error && typeof error.error === 'object') {
      return Object.values(error.error).join('\n');
    }

    return fallback;
  }

}
