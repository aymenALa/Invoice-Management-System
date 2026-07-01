import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavComponent } from './components/nav/nav.component';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, CommonModule],
  template: `
    <app-nav *ngIf="showAppNav"></app-nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  isLoggedIn = false;
  showAppNav = false;

  constructor(private authService: AuthService, private router: Router) {
    this.authService.isAuthenticated().subscribe(
      isAuthenticated => {
        this.isLoggedIn = isAuthenticated;
        this.updateNavVisibility(this.router.url);
      }
    );

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => this.updateNavVisibility((event as NavigationEnd).urlAfterRedirects));
  }

  private updateNavVisibility(url: string): void {
    this.showAppNav = this.isLoggedIn && url !== '/' && !url.startsWith('/auth');
  }
}
