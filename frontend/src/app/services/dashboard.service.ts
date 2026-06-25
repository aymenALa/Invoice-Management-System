import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api'; // Adjust this URL if needed

  constructor(private http: HttpClient) { }

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
