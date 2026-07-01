import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  features = [
    {
      icon: 'fa-file-invoice-dollar',
      title: 'Invoice Control',
      text: 'Create, edit, filter, export, and download invoice PDFs from one organized workspace.'
    },
    {
      icon: 'fa-users',
      title: 'Client Management',
      text: 'Keep every client profile, contact detail, invoice history, and access state connected.'
    },
    {
      icon: 'fa-shield-halved',
      title: 'Secure Access',
      text: 'Separate user and client authentication keeps business controls and client views cleanly divided.'
    },
    {
      icon: 'fa-paper-plane',
      title: 'Client Portal',
      text: 'Invite clients with access codes so they can view invoices, download PDFs, and update safe profile details.'
    }
  ];

  workflow = [
    'Create clients and invoices',
    'Send portal access codes',
    'Track invoice status and revenue',
    'Let clients download their own documents'
  ];
}
