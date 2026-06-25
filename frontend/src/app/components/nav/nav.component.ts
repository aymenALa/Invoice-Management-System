import { Component, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  standalone: true,
  imports: [RouterLink, CommonModule],
})
export class NavComponent {
  isDropdownOpen = false;

  constructor(private router: Router, private authService: AuthService) {}

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-button') && !target.closest('.dropdown-menu')) {
      this.isDropdownOpen = false;
    }
  }


  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

  // logout() {
  //   // Implement logout functionality
  //   this.router.navigate(['/login']); // Redirect to login or homepage
  // }

