import { Component, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
})
export class NavComponent {
  isDropdownOpen = false;
  isSettingsOpen = false;
  activeSettingsTab: 'profile' | 'password' = 'profile';
  profileForm: FormGroup;
  passwordForm: FormGroup;
  settingsError = '';
  settingsSuccess = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

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
    this.router.navigate(['/auth']);
  }

  openSettings() {
    this.isDropdownOpen = false;
    this.isSettingsOpen = true;
    this.activeSettingsTab = 'profile';
    this.settingsError = '';
    this.settingsSuccess = '';
    this.loadProfile();
  }

  closeSettings() {
    this.isSettingsOpen = false;
    this.settingsError = '';
    this.settingsSuccess = '';
    this.passwordForm.reset();
  }

  setSettingsTab(tab: 'profile' | 'password') {
    this.activeSettingsTab = tab;
    this.settingsError = '';
    this.settingsSuccess = '';
  }

  saveProfile() {
    this.settingsError = '';
    this.settingsSuccess = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.settingsError = 'Please enter a valid username and email.';
      return;
    }

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: profile => {
        this.profileForm.patchValue(profile);
        this.settingsSuccess = 'Account information updated successfully.';
      },
      error: error => {
        this.settingsError = this.getErrorMessage(error, 'Could not update account information.');
      }
    });
  }

  changePassword() {
    this.settingsError = '';
    this.settingsSuccess = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.settingsError = 'Please fill in all password fields. New password must be at least 6 characters.';
      return;
    }

    const value = this.passwordForm.value;
    if (value.newPassword !== value.confirmPassword) {
      this.settingsError = 'New password and confirmation do not match.';
      return;
    }

    this.authService.changePassword(value.currentPassword, value.newPassword).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.settingsSuccess = 'Password changed successfully.';
      },
      error: error => {
        this.settingsError = this.getErrorMessage(error, 'Could not change password.');
      }
    });
  }

  private loadProfile() {
    this.authService.getProfile().subscribe({
      next: profile => this.profileForm.patchValue(profile),
      error: error => {
        this.settingsError = this.getErrorMessage(error, 'Could not load account information.');
      }
    });
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    return fallback;
  }
}

  // logout() {
  //   // Implement logout functionality
  //   this.router.navigate(['/login']); // Redirect to login or homepage
  // }

