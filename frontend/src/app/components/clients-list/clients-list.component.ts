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
      data => this.clients = data,
      error => console.error('Error loading clients', error)
    );
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
