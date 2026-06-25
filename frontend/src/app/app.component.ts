import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './components/nav/nav.component';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, CommonModule],
  template: `
    <app-nav *ngIf="isLoggedIn"></app-nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  isLoggedIn = false;

  constructor(private authService: AuthService) {
    this.authService.isAuthenticated().subscribe(
      isAuthenticated => this.isLoggedIn = isAuthenticated
    );
  }
}
