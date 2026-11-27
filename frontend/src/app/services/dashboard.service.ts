import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  getInvoices(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices?page=${page}&size=${size}`);
  }

  getInvoiceById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices/${id}`);
  }
}
