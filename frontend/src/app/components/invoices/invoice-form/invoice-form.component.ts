import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { ClientService } from '../../../services/client.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const issueDate = group.get('issueDate')?.value;
  const dueDate = group.get('dueDate')?.value;
  if (issueDate && dueDate && dueDate < issueDate) {
    return { dueBeforeIssue: true };
  }
  return null;
}

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class InvoiceFormComponent implements OnInit {
  invoiceForm: FormGroup;
  clientForm: FormGroup;
  clients: any[] = [];
  isEditMode = false;
  invoiceId: number | null = null;
  showClientForm = false;
  selectedClient: any = null;
  isSubmitting = false;

  readonly statuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    public router: Router
  ) {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^\\+?[0-9\\-\\s]{7,18}$')]]
    });

    this.invoiceForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      issueDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0.01)]],
      status: ['DRAFT', Validators.required],
      clientId: ['', Validators.required]
    }, { validators: dateRangeValidator });
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
    this.clientService.getClients().subscribe({
      next: data => this.clients = data || [],
      error: () => {}
    });
  }

  loadInvoice(id: number): void {
    this.invoiceService.getInvoice(id).subscribe({
      next: invoice => {
        this.invoiceForm.patchValue({
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.client ? invoice.client.id : '',
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          totalAmount: invoice.totalAmount,
          status: invoice.status
        });
        this.selectedClient = invoice.client;
      },
      error: () => {
        Swal.fire('Error', 'Could not load invoice details.', 'error');
      }
    });
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      Swal.fire({
        title: 'Validation Error',
        text: this.getInvoiceValidationMessage(),
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const formValue = this.invoiceForm.value;
    const invoice: any = {
      invoiceNumber: formValue.invoiceNumber.trim(),
      issueDate: formValue.issueDate,
      dueDate: formValue.dueDate,
      totalAmount: Number(formValue.totalAmount),
      status: formValue.status,
      client: formValue.clientId ? { id: Number(formValue.clientId) } : null
    };

    const operation = this.isEditMode
      ? this.invoiceService.updateInvoice(this.invoiceId!, invoice)
      : this.invoiceService.createInvoice(invoice);

    operation.subscribe({
      next: () => {
        this.isSubmitting = false;
        Swal.fire({
          title: 'Success',
          text: `Invoice ${this.isEditMode ? 'updated' : 'created'} successfully.`,
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['/invoices']);
        });
      },
      error: error => {
        this.isSubmitting = false;
        Swal.fire({
          title: 'Error',
          text: this.getErrorMessage(error, `An error occurred while ${this.isEditMode ? 'updating' : 'creating'} the invoice.`),
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  toggleClientForm(): void {
    this.showClientForm = !this.showClientForm;
  }

  createClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.clientService.createClient(this.clientForm.value).subscribe({
      next: newClient => {
        this.clients.push(newClient);
        this.invoiceForm.patchValue({ clientId: newClient.id });
        this.showClientForm = false;
        this.clientForm.reset();
        Swal.fire({
          icon: 'success',
          title: 'Client Added',
          text: 'Client created and selected for this invoice.'
        });
      },
      error: error => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.getErrorMessage(error, 'An error occurred while creating the client.')
        });
      }
    });
  }

  private getInvoiceValidationMessage(): string {
    const missingFields: string[] = [];

    if (this.invoiceForm.get('clientId')?.hasError('required')) {
      missingFields.push('choose a client');
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
    if (this.invoiceForm.hasError('dueBeforeIssue')) {
      missingFields.push('ensure due date is on or after issue date');
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
    if (typeof error?.error === 'string') return error.error;
    if (error?.error?.message) return error.error.message;
    if (error?.error?.error) return error.error.error;
    if (error?.error && typeof error.error === 'object') {
      return Object.values(error.error).join('\n');
    }
    return fallback;
  }
}
