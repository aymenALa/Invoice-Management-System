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
      clientId: ['']
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
            text: error.error.message || `An error occurred while ${this.isEditMode ? 'updating' : 'creating'} the invoice.`,
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
        text: 'Please fill out all required fields correctly.',
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
            text: error.error.message || 'An error occurred while creating the client.',
          });
        }
      );
    }
  }
}
