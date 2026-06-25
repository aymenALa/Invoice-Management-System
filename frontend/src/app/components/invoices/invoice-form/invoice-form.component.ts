import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { ClientService } from '../../../services/client.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class InvoiceFormComponent implements OnInit {
[x: string]: any;
  invoiceForm: FormGroup;
  clientForm: FormGroup;
  clients: any[] = [];
  isEditMode = false;
  invoiceId: number | null = null;
  showClientForm = false;
  selectedClient: any = null;

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    public router: Router
  ) {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$')]],
      address: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{10,14}$')]]
    });

    this.invoiceForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      issueDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0)]],
      status: ['', Validators.required],
      clientId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadClients();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.invoiceId = +params['id'];
        this.loadInvoice(this.invoiceId);
      }
    });
  }
  loadClients(): void {
    this.clientService.getClients().subscribe(
      data => this.clients = data,
      error => console.error('Error loading clients', error)
    );
  }

  loadInvoice(id: number): void {
    this.invoiceService.getInvoice(id).subscribe(
      invoice => {
        console.log('Loaded invoice for editing:', invoice);
        this.invoiceForm.patchValue({
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.client ? invoice.client.id : '',
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          totalAmount: invoice.totalAmount,
          status: invoice.status
        });
        this.selectedClient = invoice.client;
        console.log('Selected client:', this.selectedClient);
        console.log('Form value after patch:', this.invoiceForm.value);
      },
      error => console.error('Error loading invoice', error)
    );
  }

  onSubmit(): void {
    console.log('Form value before submission:', this.invoiceForm.value);
    console.log('Form valid:', this.invoiceForm.valid);

    if (this.invoiceForm.valid) {
      const formValue = this.invoiceForm.value;
      const invoice: any = {
        invoiceNumber: formValue.invoiceNumber,
        issueDate: formValue.issueDate,
        dueDate: formValue.dueDate,
        totalAmount: formValue.totalAmount,
        status: formValue.status,
        client: formValue.clientId ? { id: formValue.clientId } : null
      };

      const operation = this.isEditMode
        ? this.invoiceService.updateInvoice(this.invoiceId!, invoice)
        : this.invoiceService.createInvoice(invoice);

      operation.subscribe(
        (response) => {
          Swal.fire({
            title: 'Success',
            text: `Invoice ${this.isEditMode ? 'updated' : 'created'} successfully`,
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/invoices']);
          });
        },
        error => {
          Swal.fire({
            title: 'Error',
            text: this.getErrorMessage(error, `An error occurred while ${this.isEditMode ? 'updating' : 'creating'} the invoice.`),
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      );
    } else {
      this.invoiceForm.markAllAsTouched();
      console.log('Form is invalid. Errors:', this.invoiceForm.errors);

      Object.keys(this.invoiceForm.controls).forEach(key => {
        const control = this.invoiceForm.get(key);
        if (control?.invalid) {
          console.log(`${key} is invalid:`, control.errors);
        }
      });

      Swal.fire({
        title: 'Validation Error',
        text: this.getInvoiceValidationMessage(),
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    }
  }


  toggleClientForm(): void {
    this.showClientForm = !this.showClientForm;
  }


  createClient(): void {
    if (this.clientForm.valid) {
      this.clientService.createClient(this.clientForm.value).subscribe(
        newClient => {
          console.log('New client created:', newClient);
          this.clients.push(newClient);
          this.invoiceForm.patchValue({ clientId: newClient.id });
          this.showClientForm = false;
          this.clientForm.reset();

          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Client created successfully.',
          });
        },
        error => {
          console.error('Error creating client', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.getErrorMessage(error, 'An error occurred while creating the client.'),
          });
        }
      );
    }
  }

  private getInvoiceValidationMessage(): string {
    const missingFields: string[] = [];

    if (this.invoiceForm.get('clientId')?.hasError('required')) {
      missingFields.push('choose an existing client or create a new one');
    }

    if (this.invoiceForm.get('invoiceNumber')?.hasError('required')) {
      missingFields.push('enter an invoice number');
    }

    if (this.invoiceForm.get('issueDate')?.hasError('required')) {
      missingFields.push('select an issue date');
    }

    if (this.invoiceForm.get('dueDate')?.hasError('required')) {
      missingFields.push('select a due date');
    }

    if (this.invoiceForm.get('totalAmount')?.hasError('required')) {
      missingFields.push('enter the total amount');
    } else if (this.invoiceForm.get('totalAmount')?.hasError('min')) {
      missingFields.push('enter a total amount greater than 0');
    }

    if (this.invoiceForm.get('status')?.hasError('required')) {
      missingFields.push('select an invoice status');
    }

    if (missingFields.length === 0) {
      return 'Please fill out all required fields correctly.';
    }

    return `Please ${missingFields.join(', ')}.`;
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
