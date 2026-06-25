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
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    // Clear any existing token before login
    this.logout();
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
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
    return this.isAuthenticatedSubject.asObservable();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.usernameKey);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Add this to your existing AuthService
  register(username: string, firstName: string, lastName: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, firstName, lastName, email, password });
  }
}
