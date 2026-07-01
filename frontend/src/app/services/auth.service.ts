import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  token: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private tokenKey = 'auth_token';
  private usernameKey= 'auth_username';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isTokenValid());

  constructor(private http: HttpClient) {}

  login(usernameOrEmail: string, password: string): Observable<LoginResponse> {
    // Clear any existing token before login
    this.logout();
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username: usernameOrEmail, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            localStorage.setItem(this.tokenKey, response.token);
            localStorage.setItem(this.usernameKey, response.username);
            this.isAuthenticatedSubject.next(true);
          }
        })
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usernameKey);
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): Observable<boolean> {
    this.isAuthenticatedSubject.next(this.isTokenValid());
    return this.isAuthenticatedSubject.asObservable();
  }

  getToken(): string | null {
    return this.isTokenValid() ? localStorage.getItem(this.tokenKey) : null;
  }

  getUsername(): string | null {
    return localStorage.getItem(this.usernameKey);
  }

  isAuthenticatedNow(): boolean {
    return this.isTokenValid();
  }

  private isTokenValid(): boolean {
    const token = localStorage.getItem(this.tokenKey);

    if (!token) {
      return false;
    }

    try {
      const payload = this.decodeJwtPayload(token);
      const expiresAt = payload.exp;

      if (typeof expiresAt !== 'number') {
        this.logout();
        return false;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      const isValid = expiresAt > nowInSeconds;

      if (!isValid) {
        this.logout();
      }

      return isValid;
    } catch {
      this.logout();
      return false;
    }
  }

  private decodeJwtPayload(token: string): { exp?: number } {
    const payload = token.split('.')[1];
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + (4 - normalizedPayload.length % 4) % 4,
      '='
    );
    const decodedPayload = atob(paddedPayload);

    return JSON.parse(decodedPayload);
  }

  // Add this to your existing AuthService
  register(username: string, firstName: string, lastName: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, firstName, lastName, email, password });
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  getProfile(): Observable<any> {
    return this.http.get('http://localhost:8080/api/user-profile');
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put('http://localhost:8080/api/user-profile', profile);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post('http://localhost:8080/api/user-profile/password', { currentPassword, newPassword });
  }
}
