import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InvoiceQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  invoiceNumber?: string;
  status?: string;
  clientId?: number;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiBaseUrl}/invoices`;

  constructor(private http: HttpClient) {}

  getInvoices(query?: InvoiceQueryParams): Observable<any> {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get(this.apiUrl, { params });
  }

  getInvoice(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getClientInvoices(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/clients/${clientId}`);
  }

  createInvoice(invoice: any): Observable<any> {
    return this.http.post(this.apiUrl, invoice);
  }

  updateInvoice(id: number, invoice: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, invoice);
  }

  deleteInvoice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  downloadInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  downloadClientInvoicesPdf(clientId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/client/${clientId}/pdf`, { responseType: 'blob' });
  }
}
