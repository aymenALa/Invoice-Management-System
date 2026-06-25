import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './auth-form.component.html',
  styleUrls: ['./auth-form.component.css']
})
export class AuthFormComponent {
  isRightPanelActive = false;
  signUpUsername = '';
  signUpFirstName = '';
  signUpLastName = '';
  signUpEmail = '';
  signUpPassword = '';
  signInEmail = '';
  signInPassword = '';

  constructor(private authService: AuthService, private router: Router) {}

  signInError = '';
  signUpError = '';

  onSignIn() {
    this.signInError = ''; // Clear previous error messages
    this.authService.login(this.signInEmail, this.signInPassword).subscribe({
      next: () => {
        console.log('Login successful');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed', err);
        this.signInError = 'Invalid username or password';
      }
    });
  }

  onSignUp() {
    this.signUpError = ''; // Clear previous error messages
    this.authService.register(
      this.signUpUsername,
      this.signUpFirstName,
      this.signUpLastName,
      this.signUpEmail,
      this.signUpPassword
    ).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        this.togglePanel(); // Switch to login panel after successful registration
      },
      error: (error) => {
        console.error('Registration failed', error);
        this.signUpError = 'Registration failed. Please try again.';
        if (error.error && error.error.message) {
          this.signUpError = error.error.message;
        }
      }
    });
  }

  togglePanel() {
    console.log('Toggle Panel Clicked');
    this.isRightPanelActive = !this.isRightPanelActive;
  }
}
