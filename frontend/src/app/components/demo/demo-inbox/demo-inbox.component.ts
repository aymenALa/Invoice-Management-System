import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { DemoDbService } from '../../../demo/demo-db.service';
import { DemoInboxMessage } from '../../../demo/demo-models';
import { AuthService } from '../../../services/auth.service';
import { ClientPortalService } from '../../../services/client-portal.service';

@Component({
  selector: 'app-demo-inbox',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './demo-inbox.component.html'
})
export class DemoInboxComponent implements OnInit {
  messages: DemoInboxMessage[] = [];
  selectedMessage: DemoInboxMessage | null = null;
  isLoading = true;

  constructor(
    private demoDb: DemoDbService,
    private authService: AuthService,
    private clientPortalService: ClientPortalService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (!environment.demoMode) {
      this.router.navigate(['/']);
      return;
    }
    await this.loadMessages();
  }

  async loadMessages(): Promise<void> {
    this.isLoading = true;
    const all = await this.demoDb.getAll<DemoInboxMessage>('demo_inbox');
    this.messages = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (this.messages.length > 0 && !this.selectedMessage) {
      await this.selectMessage(this.messages[0]);
    }
    this.isLoading = false;
  }

  async selectMessage(msg: DemoInboxMessage): Promise<void> {
    this.selectedMessage = msg;
    if (!msg.read) {
      msg.read = true;
      await this.demoDb.put('demo_inbox', msg);
    }
  }

  copyCode(code: string): void {
    navigator.clipboard?.writeText(code).then(
      () => {
        Swal.fire({ title: 'Copied', text: `Code ${code} copied to clipboard.`, icon: 'success', timer: 1400, showConfirmButton: false });
      },
      () => {
        Swal.fire({ title: 'Invitation Code', text: code, icon: 'info' });
      }
    );
  }

  openAction(msg: DemoInboxMessage): void {
    // Clear active demo session so /auth (guarded by noAuthGuard) opens cleanly for activation or password reset
    this.authService.logout();
    this.clientPortalService.logout();
    this.router.navigateByUrl(msg.actionUrl);
  }
}
