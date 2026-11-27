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
      title: 'Invoice Lifecycle Control',
      text: 'Create, edit, search, filter, and track invoices across DRAFT, SENT, PAID, OVERDUE, and CANCELLED statuses with server-side validation.'
    },
    {
      icon: 'fa-chart-line',
      title: 'Accurate Financial Overview',
      text: 'Separate paid revenue, total invoiced volume, outstanding balances, and overdue exposure with real-time aggregations and charts.'
    },
    {
      icon: 'fa-users-gear',
      title: 'Client Directory & Isolation',
      text: 'Manage client profiles, inspect per-client invoice history, and enforce strict account-level ownership and deletion integrity.'
    },
    {
      icon: 'fa-shield-halved',
      title: 'Client Self-Service Portal',
      text: 'Invite clients with time-limited activation codes, let them view their own invoices, and block or restore portal access instantly.'
    },
    {
      icon: 'fa-file-pdf',
      title: 'Print-Ready PDF Exports',
      text: 'Generate structured, print-friendly single-invoice documents and multi-invoice client statements directly from the backend.'
    },
    {
      icon: 'fa-lock',
      title: 'Role-Separated Authentication',
      text: 'Business users and client portal accounts authenticate with separate JWT claims and isolated routes.'
    }
  ];

  workflow = [
    {
      step: '01',
      title: 'Configure your business workspace',
      text: 'Register your business account, manage profile credentials, and add clients to your directory.'
    },
    {
      step: '02',
      title: 'Issue and track invoices',
      text: 'Generate numbered invoices with validated issue/due dates, monetary precision, and status tracking.'
    },
    {
      step: '03',
      title: 'Share client portal access',
      text: 'Generate or email an 8-character invitation code so clients can activate their own read-only invoice portal.'
    },
    {
      step: '04',
      title: 'Export statements & monitor cashflow',
      text: 'Download clean PDFs for any invoice or client statement and review monthly invoiced vs. paid trends.'
    }
  ];
}
