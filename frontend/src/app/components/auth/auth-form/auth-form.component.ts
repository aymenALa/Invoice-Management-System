import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './auth-form.component.html',
  styleUrls: ['./auth-form.component.css']
})
export class AuthFormComponent implements OnInit {
  isRightPanelActive = false;
  signUpUsername = '';
  signUpFirstName = '';
  signUpLastName = '';
  signUpEmail = '';
  signUpPassword = '';
  signInIdentifier = '';
  signInPassword = '';
  forgotPasswordEmail = '';
  resetToken = '';
  newPassword = '';
  confirmNewPassword = '';
  showForgotPasswordForm = false;
  passwordResetMessage = '';
  passwordResetError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  signInError = '';
  signUpError = '';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('resetToken');

      if (token) {
        this.resetToken = token;
        this.showForgotPasswordForm = true;
        this.isRightPanelActive = false;
      }
    });
  }

  onSignIn() {
    this.signInError = ''; // Clear previous error messages
    this.authService.login(this.signInIdentifier, this.signInPassword).subscribe({
      next: () => {
        console.log('Login successful');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed', err);
        this.signInError = 'Invalid username/email or password';
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
    this.closePasswordResetForm();
  }

  showPasswordResetForm(event: Event) {
    event.preventDefault();
    this.signInError = '';
    this.passwordResetMessage = '';
    this.passwordResetError = '';
    this.showForgotPasswordForm = true;
  }

  closePasswordResetForm() {
    this.showForgotPasswordForm = false;
    this.passwordResetMessage = '';
    this.passwordResetError = '';
    this.forgotPasswordEmail = '';
    this.newPassword = '';
    this.confirmNewPassword = '';

    if (this.resetToken) {
      this.resetToken = '';
      this.router.navigate(['/auth']);
    }
  }

  requestPasswordReset() {
    this.passwordResetMessage = '';
    this.passwordResetError = '';

    if (!this.forgotPasswordEmail) {
      this.passwordResetError = 'Please enter your email address.';
      return;
    }

    this.authService.requestPasswordReset(this.forgotPasswordEmail).subscribe({
      next: () => {
        this.passwordResetMessage = 'If that email exists, a reset link was sent.';
      },
      error: () => {
        this.passwordResetError = 'Could not send the reset email. Please try again later.';
      }
    });
  }

  resetForgottenPassword() {
    this.passwordResetMessage = '';
    this.passwordResetError = '';

    if (!this.newPassword || !this.confirmNewPassword) {
      this.passwordResetError = 'Please fill in both password fields.';
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordResetError = 'Passwords do not match.';
      return;
    }

    this.authService.resetPassword(this.resetToken, this.newPassword).subscribe({
      next: () => {
        this.passwordResetMessage = 'Password updated. You can sign in now.';
        this.resetToken = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.router.navigate(['/auth']);
      },
      error: (error) => {
        this.passwordResetError = error?.error?.error || 'The reset link is invalid or expired.';
      }
    });
  }
}
