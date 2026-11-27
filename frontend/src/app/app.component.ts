import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavComponent } from './components/nav/nav.component';
import { DemoToolbarComponent } from './components/demo/demo-toolbar/demo-toolbar.component';
import { DemoWelcomeComponent } from './components/demo/demo-welcome/demo-welcome.component';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, DemoToolbarComponent, DemoWelcomeComponent, CommonModule],
  template: `
    <app-demo-toolbar *ngIf="isDemoMode" (openWelcome)="showWelcome = true"></app-demo-toolbar>
    <app-nav *ngIf="showAppNav"></app-nav>
    <router-outlet></router-outlet>
    <app-demo-welcome *ngIf="isDemoMode" [visible]="showWelcome" (dismissed)="showWelcome = false"></app-demo-welcome>
  `
})
export class AppComponent implements OnInit {
  readonly isDemoMode = environment.demoMode;
  isLoggedIn = false;
  showAppNav = false;
  showWelcome = false;

  constructor(private authService: AuthService, private router: Router) {
    this.authService.isAuthenticated().subscribe(
      isAuthenticated => {
        this.isLoggedIn = isAuthenticated;
        this.updateNavVisibility(this.router.url);
      }
    );

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        this.updateNavVisibility(url);
        this.checkFirstDemoVisit(url);
      });
  }

  ngOnInit(): void {
    this.checkFirstDemoVisit(this.router.url);
  }

  private checkFirstDemoVisit(url: string): void {
    if (!this.isDemoMode) return;
    if (localStorage.getItem('ims_demo_welcome_dismissed') === 'true') return;
    if (url !== '/') {
      this.showWelcome = true;
    }
  }

  private updateNavVisibility(url: string): void {
    this.showAppNav = this.isLoggedIn
      && url !== '/'
      && !url.startsWith('/auth')
      && !url.startsWith('/client-portal')
      && !url.startsWith('/demo');
  }
}
