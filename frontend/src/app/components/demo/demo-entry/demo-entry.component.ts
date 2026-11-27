import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { DemoBackendService } from '../../../demo/demo-backend.service';
import { AuthService } from '../../../services/auth.service';
import { ClientPortalService } from '../../../services/client-portal.service';

@Component({
  selector: 'app-demo-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demo-entry.component.html'
})
export class DemoEntryComponent implements OnInit {
  eligibleClients: Array<{ clientId: number; name: string; email: string }> = [];
  selectedClientId: number | null = null;
  errorMessage = '';

  constructor(
    private demoBackend: DemoBackendService,
    private authService: AuthService,
    private clientPortalService: ClientPortalService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!environment.demoMode) {
      this.router.navigate(['/auth']);
      return;
    }
    this.eligibleClients = await this.demoBackend.getEligiblePortalClients();
    if (this.eligibleClients.length > 0) {
      this.selectedClientId = this.eligibleClients[0].clientId;
    }
  }

  async enterBusinessWorkspace(userId = 1): Promise<void> {
    this.errorMessage = '';
    this.clientPortalService.logout();
    const session = await this.demoBackend.issueBusinessSession(userId);
    this.authService.setDemoSession(session.token, session.username, session.displayName);
    this.router.navigate(['/dashboard']);
  }

  async enterClientPortal(): Promise<void> {
    this.errorMessage = '';
    if (!this.selectedClientId) return;
    try {
      this.authService.logout();
      const session = await this.demoBackend.issueClientSession(Number(this.selectedClientId));
      this.clientPortalService.setDemoSession(session);
      this.router.navigate(['/client-portal']);
    } catch (err: any) {
      this.errorMessage = err?.message || 'Unable to enter client portal for this account.';
    }
  }
}
