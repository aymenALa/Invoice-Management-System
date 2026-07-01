import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface ClientAuthResponse {
  token: string;
  clientId: number;
  clientName: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientPortalService {
  private clientAuthUrl = 'http://localhost:8080/api/client-auth';
  private clientPortalUrl = 'http://localhost:8080/api/client-portal';
  private tokenKey = 'client_auth_token';
  private clientNameKey = 'client_auth_name';
  private clientEmailKey = 'client_auth_email';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isTokenPresent());

  constructor(private http: HttpClient) {}

  activate(email: string, invitationCode: string, password: string): Observable<ClientAuthResponse> {
    this.logout();
    return this.http.post<ClientAuthResponse>(`${this.clientAuthUrl}/activate`, { email, invitationCode, password })
      .pipe(tap(response => this.storeSession(response)));
  }

  login(email: string, password: string): Observable<ClientAuthResponse> {
    this.logout();
    return this.http.post<ClientAuthResponse>(`${this.clientAuthUrl}/login`, { email, password })
      .pipe(tap(response => this.storeSession(response)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.clientNameKey);
    localStorage.removeItem(this.clientEmailKey);
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): Observable<boolean> {
    this.isAuthenticatedSubject.next(this.isTokenPresent());
    return this.isAuthenticatedSubject.asObservable();
  }

  isAuthenticatedNow(): boolean {
    return this.isTokenPresent();
  }

  getToken(): string | null {
    return this.isTokenPresent() ? localStorage.getItem(this.tokenKey) : null;
  }

  getClientName(): string | null {
    return localStorage.getItem(this.clientNameKey);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.clientPortalUrl}/me`);
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put(`${this.clientPortalUrl}/me`, profile);
  }

  getInvoices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.clientPortalUrl}/invoices`);
  }

  downloadInvoicePdf(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.clientPortalUrl}/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
  }

  downloadAllInvoicesPdf(): Observable<Blob> {
    return this.http.get(`${this.clientPortalUrl}/invoices/pdf`, { responseType: 'blob' });
  }

  private storeSession(response: ClientAuthResponse): void {
    if (response?.token) {
      localStorage.setItem(this.tokenKey, response.token);
      localStorage.setItem(this.clientNameKey, response.clientName);
      localStorage.setItem(this.clientEmailKey, response.email);
      this.isAuthenticatedSubject.next(true);
    }
  }

  private isTokenPresent(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}
