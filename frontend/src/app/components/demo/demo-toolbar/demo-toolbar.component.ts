import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { DemoBackendService } from '../../../demo/demo-backend.service';
import { DemoDbService } from '../../../demo/demo-db.service';
import { AuthService } from '../../../services/auth.service';
import { ClientPortalService } from '../../../services/client-portal.service';

@Component({
  selector: 'app-demo-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demo-toolbar.component.html'
})
export class DemoToolbarComponent implements OnInit, OnDestroy {
  @Output() openWelcome = new EventEmitter<void>();

  activeRole: 'BUSINESS' | 'CLIENT' | 'GUEST' = 'GUEST';
  activeLabel = 'Demo Guest';
  unreadCount = 0;
  eligibleClients: Array<{ clientId: number; name: string; email: string }> = [];
  selectedClientId: number | null = null;
  private sub = new Subscription();

  constructor(
    private demoBackend: DemoBackendService,
    private demoDb: DemoDbService,
    private authService: AuthService,
    private clientPortalService: ClientPortalService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.demoDb.ensureInitialized();
    this.syncRole();
    await this.refreshEligibleClients();

    this.sub.add(this.authService.isAuthenticated().subscribe(() => this.syncRole()));
    this.sub.add(this.clientPortalService.isAuthenticated().subscribe(() => this.syncRole()));
    this.sub.add(this.demoDb.unreadInboxCount$.subscribe(count => (this.unreadCount = count)));
    this.sub.add(this.demoDb.dataChanged$.subscribe(() => this.refreshEligibleClients()));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private syncRole(): void {
    if (this.authService.isAuthenticatedNow()) {
      this.activeRole = 'BUSINESS';
      this.activeLabel = `Business: ${this.authService.getUsername() || 'Workspace'}`;
    } else if (this.clientPortalService.isAuthenticatedNow()) {
      this.activeRole = 'CLIENT';
      this.activeLabel = `Client: ${this.clientPortalService.getClientName() || 'Portal'}`;
    } else {
      this.activeRole = 'GUEST';
      this.activeLabel = 'Demo Mode';
    }
  }

  async refreshEligibleClients(): Promise<void> {
    this.eligibleClients = await this.demoBackend.getEligiblePortalClients();
    if (this.eligibleClients.length > 0 && !this.eligibleClients.some(c => c.clientId === this.selectedClientId)) {
      this.selectedClientId = this.eligibleClients[0].clientId;
    }
  }

  async switchToBusiness(): Promise<void> {
    this.clientPortalService.logout();
    const session = await this.demoBackend.issueBusinessSession(1);
    this.authService.setDemoSession(session.token, session.username, session.displayName);
    this.syncRole();
    this.router.navigate(['/dashboard']);
  }

  async switchToClient(clientId?: number | null): Promise<void> {
    const targetId = clientId || this.selectedClientId;
    if (!targetId) return;
    try {
      this.authService.logout();
      const session = await this.demoBackend.issueClientSession(Number(targetId));
      this.clientPortalService.setDemoSession(session);
      this.syncRole();
      this.router.navigate(['/client-portal']);
    } catch (err: any) {
      Swal.fire('Portal Unavailable', err?.message || 'This client account cannot access the portal.', 'warning');
    }
  }

  resetDemo(): void {
    Swal.fire({
      title: 'Reset demo data?',
      text: 'This will erase all local browser modifications (clients, invoices, invitations, Demo Inbox) and restore the synthetic seed dataset.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reset Demo Data',
      cancelButtonText: 'Cancel'
    }).then(async result => {
      if (!result.isConfirmed) return;
      await this.demoDb.resetDemoData();
      this.authService.logout();
      this.clientPortalService.logout();
      this.syncRole();
      await this.refreshEligibleClients();
      this.router.navigate(['/demo']);
      Swal.fire('Demo Reset', 'All synthetic demo records have been restored.', 'success');
    });
  }
}
