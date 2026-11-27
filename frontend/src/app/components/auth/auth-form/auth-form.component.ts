import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ClientPortalService } from '../../../services/client-portal.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './auth-form.component.html',
  styleUrls: ['./auth-form.component.css']
})
export class AuthFormComponent implements OnInit {
  accountType: 'user' | 'client' = 'user';
  clientAuthMode: 'login' | 'activate' = 'login';
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
  clientEmail = '';
  clientAccessCode = '';
  clientPassword = '';
  clientConfirmPassword = '';
  clientSignInMessage = '';
  clientSignInError = '';

  signInError = '';
  signUpError = '';
  signUpSuccess = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private clientPortalService: ClientPortalService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('resetToken');
      const accountType = params.get('accountType');
      const clientMessage = params.get('clientMessage');

      if (accountType === 'client') {
        this.accountType = 'client';
        this.clientSignInError = clientMessage || '';
      }

      if (token) {
        this.accountType = 'user';
        this.resetToken = token;
        this.showForgotPasswordForm = true;
        this.isRightPanelActive = false;
      }
    });
  }

  onSignIn() {
    this.signInError = '';
    if (!this.signInIdentifier.trim() || !this.signInPassword) {
      this.signInError = 'Please enter your username/email and password.';
      return;
    }

    this.isSubmitting = true;
    this.clientPortalService.logout();
    this.authService.login(this.signInIdentifier.trim(), this.signInPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.signInError = err?.error?.message || 'Invalid username/email or password.';
      }
    });
  }

  onSignUp() {
    this.signUpError = '';
    this.signUpSuccess = '';
    if (!this.signUpUsername.trim() || !this.signUpEmail.trim() || !this.signUpPassword) {
      this.signUpError = 'Username, email, and password are required.';
      return;
    }

    this.isSubmitting = true;
    this.authService.register(
      this.signUpUsername.trim(),
      this.signUpFirstName.trim(),
      this.signUpLastName.trim(),
      this.signUpEmail.trim(),
      this.signUpPassword
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.signUpSuccess = 'Account created. You can sign in now.';
        this.signInIdentifier = this.signUpUsername.trim();
        this.isRightPanelActive = false;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.signUpError = error?.error?.message || error?.error?.error || (typeof error?.error === 'string' ? error.error : 'Registration failed. Please verify your details.');
      }
    });
  }

  togglePanel() {
    this.isRightPanelActive = !this.isRightPanelActive;
    this.signInError = '';
    this.signUpError = '';
    this.closePasswordResetForm();
  }

  selectAccountType(type: 'user' | 'client') {
    this.accountType = type;
    this.isRightPanelActive = false;
    this.signInError = '';
    this.signUpError = '';
    this.signUpSuccess = '';
    this.clientSignInMessage = '';
    this.clientSignInError = '';
    this.closePasswordResetForm();
  }

  setClientAuthMode(mode: 'login' | 'activate') {
    this.clientAuthMode = mode;
    this.clientSignInMessage = '';
    this.clientSignInError = '';
    this.clientAccessCode = '';
    this.clientPassword = '';
    this.clientConfirmPassword = '';
  }

  onClientSignIn() {
    this.clientSignInMessage = '';
    this.clientSignInError = '';
    this.authService.logout();

    if (!this.clientEmail.trim() || !this.clientPassword) {
      this.clientSignInError = 'Please enter your email and password.';
      return;
    }

    if (this.clientAuthMode === 'activate') {
      this.activateClientPortal();
      return;
    }

    this.isSubmitting = true;
    this.clientPortalService.login(this.clientEmail.trim(), this.clientPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/client-portal']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.clientSignInError = error?.error?.message || 'Invalid client email or password.';
      }
    });
  }

  private activateClientPortal() {
    if (!this.clientAccessCode.trim()) {
      this.clientSignInError = 'Please enter your invitation code.';
      return;
    }

    if (this.clientPassword !== this.clientConfirmPassword) {
      this.clientSignInError = 'Passwords do not match.';
      return;
    }

    this.isSubmitting = true;
    this.clientPortalService.activate(this.clientEmail.trim(), this.clientAccessCode.trim(), this.clientPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/client-portal']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.clientSignInError = error?.error?.message || 'Could not activate the client portal account.';
      }
    });
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

    if (!this.forgotPasswordEmail.trim()) {
      this.passwordResetError = 'Please enter your email address.';
      return;
    }

    this.isSubmitting = true;
    this.authService.requestPasswordReset(this.forgotPasswordEmail.trim()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.passwordResetMessage = 'If that email exists, a reset link was sent.';
      },
      error: () => {
        this.isSubmitting = false;
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

    this.isSubmitting = true;
    this.authService.resetPassword(this.resetToken, this.newPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.passwordResetMessage = 'Password updated. You can sign in now.';
        this.resetToken = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.router.navigate(['/auth']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.passwordResetError = error?.error?.error || error?.error?.message || 'The reset link is invalid or expired.';
      }
    });
  }
}
