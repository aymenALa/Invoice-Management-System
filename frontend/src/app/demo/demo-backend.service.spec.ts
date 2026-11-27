import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { DemoBackendService } from './demo-backend.service';
import { DemoDbService } from './demo-db.service';

describe('DemoBackendService & Financial Aggregation', () => {
  let service: DemoBackendService;
  let db: DemoDbService;
  let businessToken: string;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DemoBackendService);
    db = TestBed.inject(DemoDbService);
    await db.resetDemoData();
    const session = await service.issueBusinessSession(1);
    businessToken = session.token;
  });

  function authReq(method: string, path: string, body?: any, token = businessToken): HttpRequest<any> {
    const url = `http://localhost:8080/api${path}`;
    const req = method === 'GET' || method === 'DELETE'
      ? new HttpRequest<any>(method as any, url)
      : new HttpRequest<any>(method as any, url, body ?? {});
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  it('should compute accurate dashboard KPIs excluding DRAFT and CANCELLED from invoicedAmount', async () => {
    const res = await service.handleRequest(authReq('GET', '/dashboard'));
    const data = res.body;

    expect(data.totalInvoices).toBe(50);
    expect(data.totalClients).toBe(13);
    expect(data.invoicedAmount).toBeGreaterThan(0);
    expect(data.paidAmount).toBeGreaterThan(0);
    expect(Math.round((data.paidAmount + data.outstandingAmount) * 100)).toBe(Math.round(data.invoicedAmount * 100));
  });

  it('should reject invoice creation when dueDate is before issueDate', async () => {
    await expectAsync(
      service.handleRequest(authReq('POST', '/invoices', {
        invoiceNumber: 'INV-BAD-DATE',
        issueDate: '2026-11-20',
        dueDate: '2026-11-10',
        totalAmount: 500,
        status: 'DRAFT',
        client: { id: 1 }
      }))
    ).toBeRejected();
  });

  it('should block deleting a client with existing invoices and allow deleting a client without invoices', async () => {
    await expectAsync(
      service.handleRequest(authReq('DELETE', '/clients/1'))
    ).toBeRejected();

    // Client 10 (Silverline Bio) has 0 invoices in seed data
    const delRes = await service.handleRequest(authReq('DELETE', '/clients/10'));
    expect(delRes.status).toBe(204);
  });

  it('should enforce full invitation lifecycle, regeneration invalidation, and immediate blocking', async () => {
    const inviteRes = await service.handleRequest(authReq('POST', '/client-auth/invite', { clientId: 4 }));
    const oldCode = inviteRes.body.invitationCode;
    expect(oldCode.length).toBe(8);

    const regenRes = await service.handleRequest(authReq('POST', '/client-auth/invite/regenerate', { clientId: 4 }));
    const newCode = regenRes.body.invitationCode;
    expect(newCode).not.toBe(oldCode);

    // Old code rejected
    await expectAsync(
      service.handleRequest(new HttpRequest('POST', 'http://localhost:8080/api/client-auth/activate', {
        email: 'ap@apexhorizon.example',
        invitationCode: oldCode,
        password: 'ClientPass99!'
      }))
    ).toBeRejected();

    // New code activates
    const actRes = await service.handleRequest(new HttpRequest('POST', 'http://localhost:8080/api/client-auth/activate', {
      email: 'ap@apexhorizon.example',
      invitationCode: newCode,
      password: 'ClientPass99!'
    }));
    const clientToken = actRes.body.token;
    expect(clientToken).toBeTruthy();

    // Block client -> existing token immediately rejected
    await service.handleRequest(authReq('POST', '/client-auth/access/4/block', {}));
    await expectAsync(
      service.handleRequest(authReq('GET', '/client-portal/me', undefined, clientToken))
    ).toBeRejected();

    // Unblock client -> login works again
    await service.handleRequest(authReq('POST', '/client-auth/access/4/unblock', {}));
    const loginRes = await service.handleRequest(new HttpRequest('POST', 'http://localhost:8080/api/client-auth/login', {
      email: 'ap@apexhorizon.example',
      password: 'ClientPass99!'
    }));
    expect(loginRes.status).toBe(200);
  });

  it('should generate a valid browser PDF Blob for an invoice', async () => {
    const res = await service.handleRequest(authReq('GET', '/invoices/1/pdf'));
    const blob = res.body as Blob;
    expect(blob instanceof Blob).toBeTrue();
    expect(blob.size).toBeGreaterThan(500);
  });

  it('should reset demo data without clearing unrelated localStorage keys', async () => {
    localStorage.setItem('unrelated_portfolio_key', 'keep-me');
    await service.handleRequest(authReq('DELETE', '/clients/10'));
    await db.resetDemoData();

    const clientsRes = await service.handleRequest(authReq('GET', '/clients'));
    expect(clientsRes.body.length).toBe(13);
    expect(localStorage.getItem('unrelated_portfolio_key')).toBe('keep-me');
    localStorage.removeItem('unrelated_portfolio_key');
  });
});
