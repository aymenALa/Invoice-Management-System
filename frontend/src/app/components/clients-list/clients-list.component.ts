import { Component, OnInit } from '@angular/core';
import { ClientService } from '../../services/client.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ClientsListComponent implements OnInit {
  clients: any[] = [];

  constructor(private clientService: ClientService, private router: Router) { }

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

}
