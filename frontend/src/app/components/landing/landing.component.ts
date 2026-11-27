import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  readonly isDemoMode = environment.demoMode;
  readonly githubUrl = 'https://github.com/aymenALa/Invoice-Management-System';

  techStack = [
    { name: 'Angular 17', role: 'Standalone SPA' },
    { name: 'TypeScript', role: 'Strict Typing' },
    { name: 'Tailwind CSS', role: 'Design System' },
    { name: 'Chart.js', role: 'Financial Charts' },
    { name: 'Java 21', role: 'Runtime' },
    { name: 'Spring Boot 3.2', role: 'REST API' },
    { name: 'Spring Security', role: 'JWT & RBAC' },
    { name: 'PostgreSQL', role: 'Relational Store' },
    { name: 'iText 7', role: 'PDF Engine' }
  ];

  securityControls = [
    {
      icon: 'fa-shield-halved',
      title: 'Separate Business & Client JWTs',
      text: 'Business users (USER) and client portal accounts (CLIENT) receive distinct JWT claims. JwtAuthenticationFilter explicitly rejects client tokens from back-office endpoints.'
    },
    {
      icon: 'fa-key',
      title: 'SecureRandom Invitations & BCrypt',
      text: '8-character invitation codes are generated via SecureRandom, stored as BCrypt hashes, expire in 7 days, and are invalidated upon single-use activation or regeneration.'
    },
    {
      icon: 'fa-ban',
      title: 'Immediate Blocked-Account Enforcement',
      text: 'Every client portal request re-verifies account.isEnabled() in PostgreSQL, immediately revoking access for blocked accounts even if a prior JWT has not expired.'
    },
    {
      icon: 'fa-user-lock',
      title: 'Ownership & Restricted Updates',
      text: 'Every invoice and client query enforces user ownership. Client portal profile updates are restricted to safe contact fields via dedicated DTOs.'
    }
  ];

  invitationSteps = [
    {
      step: '01',
      title: 'Generate Code',
      text: 'Create an 8-character SecureRandom invitation code with a 7-day TTL from the client directory.'
    },
    {
      step: '02',
      title: 'Deliver / Demo Inbox',
      text: 'Send via Spring Mail SMTP in full-stack mode, or inspect the simulated message in Demo Inbox.'
    },
    {
      step: '03',
      title: 'Activate Portal',
      text: 'Client enters their email, code, and chosen password; the code is hashed and marked consumed.'
    },
    {
      step: '04',
      title: 'Self-Service & Control',
      text: 'Client views invoices and downloads PDFs while the business user can block or restore access anytime.'
    }
  ];
}
