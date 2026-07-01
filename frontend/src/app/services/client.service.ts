import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = 'http://localhost:8080/api/clients';
  private clientAuthUrl = 'http://localhost:8080/api/client-auth';

  constructor(private http: HttpClient) { }

  getClients(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getClient(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createClient(client: any): Observable<any> {
    return this.http.post(this.apiUrl, client);
  }

  updateClient(id: number, client: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, client);
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  generateClientAccessCode(clientId: number): Observable<any> {
    return this.http.post(`${this.clientAuthUrl}/invite`, { clientId });
  }

  regenerateClientAccessCode(clientId: number): Observable<any> {
    return this.http.post(`${this.clientAuthUrl}/invite/regenerate`, { clientId });
  }

  sendClientAccessCode(clientId: number): Observable<any> {
    return this.http.post(`${this.clientAuthUrl}/invite/send`, { clientId });
  }

  getClientPortalAccess(clientId: number): Observable<any> {
    return this.http.get(`${this.clientAuthUrl}/access/${clientId}`);
  }

  blockClientPortalAccess(clientId: number): Observable<any> {
    return this.http.post(`${this.clientAuthUrl}/access/${clientId}/block`, {});
  }

  unblockClientPortalAccess(clientId: number): Observable<any> {
    return this.http.post(`${this.clientAuthUrl}/access/${clientId}/unblock`, {});
  }
}
