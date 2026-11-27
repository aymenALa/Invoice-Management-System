import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/auth`;
  private profileUrl = `${environment.apiBaseUrl}/user-profile`;
  private tokenKey = 'auth_token';
  private usernameKey = 'auth_username';
  private displayNameKey = 'auth_display_name';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isTokenValid());
  private usernameSubject = new BehaviorSubject<string | null>(this.getStoredDisplayName());

  constructor(private http: HttpClient) {}

  login(usernameOrEmail: string, password: string): Observable<LoginResponse> {
    this.logout();
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username: usernameOrEmail, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            localStorage.setItem(this.tokenKey, response.token);
            localStorage.setItem(this.usernameKey, response.username);
            localStorage.setItem(this.displayNameKey, response.username);
            this.isAuthenticatedSubject.next(true);
            this.usernameSubject.next(response.username);
          }
        })
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usernameKey);
    localStorage.removeItem(this.displayNameKey);
    this.isAuthenticatedSubject.next(false);
    this.usernameSubject.next(null);
  }

  setDemoSession(token: string, username: string, displayName?: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.usernameKey, username);
    localStorage.setItem(this.displayNameKey, displayName || username);
    this.isAuthenticatedSubject.next(true);
    this.usernameSubject.next(displayName || username);
  }

  isAuthenticated(): Observable<boolean> {
    this.isAuthenticatedSubject.next(this.isTokenValid());
    return this.isAuthenticatedSubject.asObservable();
  }

  displayName$(): Observable<string | null> {
    return this.usernameSubject.asObservable();
  }

  getToken(): string | null {
    return this.isTokenValid() ? localStorage.getItem(this.tokenKey) : null;
  }

  getUsername(): string | null {
    return localStorage.getItem(this.displayNameKey) || localStorage.getItem(this.usernameKey);
  }

  isAuthenticatedNow(): boolean {
    return this.isTokenValid();
  }

  private getStoredDisplayName(): string | null {
    return localStorage.getItem(this.displayNameKey) || localStorage.getItem(this.usernameKey);
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
    return JSON.parse(atob(paddedPayload));
  }

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
    return this.http.get(this.profileUrl).pipe(
      tap((profile: any) => this.syncDisplayName(profile))
    );
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put(this.profileUrl, profile).pipe(
      tap((updated: any) => this.syncDisplayName(updated))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.profileUrl}/password`, { currentPassword, newPassword });
  }

  private syncDisplayName(profile: any): void {
    if (!profile) return;
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    const display = fullName || profile.username || localStorage.getItem(this.usernameKey);
    if (display) {
      localStorage.setItem(this.displayNameKey, display);
      this.usernameSubject.next(display);
    }
  }
}
