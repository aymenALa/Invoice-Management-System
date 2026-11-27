import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { DemoDbService } from './demo-db.service';
import { DemoPdfService } from './demo-pdf.service';
import {
  DemoClient,
  DemoInboxMessage,
  DemoInvitation,
  DemoInvoice,
  DemoPortalAccount,
  DemoUser,
  InvoiceStatus
} from './demo-models';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable({
  providedIn: 'root'
})
export class DemoBackendService {
  constructor(
    private db: DemoDbService,
    private pdfService: DemoPdfService
  ) {}

  async handleRequest(req: HttpRequest<any>): Promise<HttpResponse<any>> {
    await this.db.ensureInitialized();

    const urlObj = new URL(req.url, 'http://localhost');
    const path = urlObj.pathname;
    const method = req.method.toUpperCase();
    const authHeader = req.headers.get('Authorization');

    // Public Auth Routes
    if (path === '/api/auth/login' && method === 'POST') {
      return this.loginUser(req.body);
    }
    if (path === '/api/auth/register' && method === 'POST') {
      return this.registerUser(req.body);
    }
    if (path === '/api/auth/forgot-password' && method === 'POST') {
      return this.forgotPassword(req.body);
    }
    if (path === '/api/auth/reset-password' && method === 'POST') {
      return this.resetPassword(req.body);
    }

    // Public Client Auth Routes
    if (path === '/api/client-auth/activate' && method === 'POST') {
      return this.activateClient(req.body);
    }
    if (path === '/api/client-auth/login' && method === 'POST') {
      return this.loginClient(req.body);
    }

    // Client Portal Routes (Client token required)
    if (path.startsWith('/api/client-portal')) {
      return this.handleClientPortal(method, path, req.body, authHeader);
    }

    // All remaining /api/* routes require Business User token
    const user = await this.requireBusinessUser(authHeader);

    if (path === '/api/user-profile' && method === 'GET') {
      return this.ok(this.toUserProfile(user));
    }
    if (path === '/api/user-profile' && method === 'PUT') {
      return this.updateUserProfile(user, req.body);
    }
    if (path === '/api/user-profile/password' && method === 'POST') {
      return this.changeUserPassword(user, req.body);
    }
    if (path === '/api/dashboard' && method === 'GET') {
      return this.getDashboard(user);
    }

    // Clients CRUD
    if (path === '/api/clients' && method === 'GET') {
      const clients = (await this.db.getAll<DemoClient>('clients')).filter(c => c.userId === user.id);
      return this.ok(clients);
    }
    if (path === '/api/clients' && method === 'POST') {
      return this.createClient(user, req.body);
    }
    const clientMatch = path.match(/^\/api\/clients\/(\d+)$/);
    if (clientMatch) {
      const clientId = Number(clientMatch[1]);
      if (method === 'GET') return this.ok(await this.requireOwnedClient(clientId, user));
      if (method === 'PUT') return this.updateClient(clientId, user, req.body);
      if (method === 'DELETE') return this.deleteClient(clientId, user);
    }

    // Client Auth Management (Business User)
    if (path === '/api/client-auth/invite' && method === 'POST') {
      return this.ok(await this.inviteClient(Number(req.body?.clientId), user));
    }
    if (path === '/api/client-auth/invite/regenerate' && method === 'POST') {
      return this.ok(await this.regenerateInvitation(Number(req.body?.clientId), user));
    }
    if (path === '/api/client-auth/invite/send' && method === 'POST') {
      return this.ok(await this.sendInvitation(Number(req.body?.clientId), user));
    }
    const accessMatch = path.match(/^\/api\/client-auth\/access\/(\d+)(?:\/(block|unblock))?$/);
    if (accessMatch) {
      const clientId = Number(accessMatch[1]);
      const action = accessMatch[2];
      if (!action && method === 'GET') return this.ok(await this.getClientPortalAccess(clientId, user));
      if (action === 'block' && method === 'POST') return this.ok(await this.setClientPortalAccess(clientId, user, false));
      if (action === 'unblock' && method === 'POST') return this.ok(await this.setClientPortalAccess(clientId, user, true));
    }

    // Invoices CRUD & PDFs
    if (path === '/api/invoices' && method === 'GET') {
      return this.findInvoices(user, urlObj.searchParams);
    }
    if (path === '/api/invoices' && method === 'POST') {
      return this.createInvoice(user, req.body);
    }
    const invPdfMatch = path.match(/^\/api\/invoices\/(\d+)\/pdf$/);
    if (invPdfMatch && method === 'GET') {
      const inv = await this.requireOwnedInvoice(Number(invPdfMatch[1]), user);
      const client = await this.db.getById<DemoClient>('clients', inv.clientId);
      const blob = await this.pdfService.generateInvoicePdf({ ...inv, client }, user);
      return this.ok(blob);
    }
    const clientInvListMatch = path.match(/^\/api\/invoices\/clients\/(\d+)$/);
    if (clientInvListMatch && method === 'GET') {
      const client = await this.requireOwnedClient(Number(clientInvListMatch[1]), user);
      const list = await this.hydrateInvoices((await this.db.getAll<DemoInvoice>('invoices')).filter(i => i.userId === user.id && i.clientId === client.id));
      return this.ok(list);
    }
    const clientInvPdfMatch = path.match(/^\/api\/invoices\/client\/(\d+)\/pdf$/);
    if (clientInvPdfMatch && method === 'GET') {
      const client = await this.requireOwnedClient(Number(clientInvPdfMatch[1]), user);
      const list = (await this.db.getAll<DemoInvoice>('invoices')).filter(i => i.userId === user.id && i.clientId === client.id);
      if (list.length === 0) {
        throw this.httpError(404, 'No invoices found for client');
      }
      const blob = await this.pdfService.generateClientInvoicesPdf(client, list);
      return this.ok(blob);
    }
    const invMatch = path.match(/^\/api\/invoices\/(\d+)$/);
    if (invMatch) {
      const invId = Number(invMatch[1]);
      if (method === 'GET') {
        const inv = await this.requireOwnedInvoice(invId, user);
        const [hydrated] = await this.hydrateInvoices([inv]);
        return this.ok(hydrated);
      }
      if (method === 'PUT') return this.updateInvoice(invId, user, req.body);
      if (method === 'DELETE') return this.deleteInvoice(invId, user);
    }

    throw this.httpError(404, `Demo endpoint not implemented: ${method} ${path}`);
  }

  // --- Role Switcher Helpers (Demo Only) ---
  async issueBusinessSession(userId = 1): Promise<{ token: string; username: string; displayName: string }> {
    await this.db.ensureInitialized();
    const user = (await this.db.getById<DemoUser>('users', userId))
      || (await this.db.getAll<DemoUser>('users'))[0];
    const token = this.createDemoJwt({ sub: user.username, accountType: 'USER', userId: user.id });
    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
    return { token, username: user.username, displayName };
  }

  async issueClientSession(clientId: number): Promise<{ token: string; clientId: number; clientName: string; email: string }> {
    await this.db.ensureInitialized();
    const account = (await this.db.getAll<DemoPortalAccount>('portal_accounts'))
      .find(a => a.clientId === clientId);
    if (!account) {
      throw new Error('This client has not activated portal access.');
    }
    if (!account.enabled) {
      throw new Error('This client portal account is blocked.');
    }
    const client = await this.db.getById<DemoClient>('clients', clientId);
    if (!client) {
      throw new Error('Client not found.');
    }
    const token = this.createDemoJwt({
      sub: account.email,
      accountType: 'CLIENT',
      clientAccountId: account.id,
      clientId: client.id
    });
    return { token, clientId: client.id, clientName: client.name, email: account.email };
  }

  async getEligiblePortalClients(): Promise<Array<{ clientId: number; name: string; email: string }>> {
    await this.db.ensureInitialized();
    const accounts = await this.db.getAll<DemoPortalAccount>('portal_accounts');
    const clients = await this.db.getAll<DemoClient>('clients');
    const result: Array<{ clientId: number; name: string; email: string }> = [];
    for (const acc of accounts) {
      if (!acc.enabled) continue;
      const client = clients.find(c => c.id === acc.clientId);
      if (client) {
        result.push({ clientId: client.id, name: client.name, email: acc.email });
      }
    }
    return result;
  }

  // --- Business Auth ---
  private async loginUser(body: any): Promise<HttpResponse<any>> {
    const identifier = String(body?.username || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const users = await this.db.getAll<DemoUser>('users');
    const user = users.find(u =>
      (u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier)
      && u.password === password
      && u.enabled
    );
    if (!user) {
      throw this.httpError(401, 'Invalid username/email or password');
    }
    const token = this.createDemoJwt({ sub: user.username, accountType: 'USER', userId: user.id });
    return this.ok({ token, username: user.username });
  }

  private async registerUser(body: any): Promise<HttpResponse<any>> {
    const username = String(body?.username || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!username || !email || password.length < 6) {
      throw this.httpError(400, 'Username, valid email, and password (min 6 chars) are required.');
    }
    const users = await this.db.getAll<DemoUser>('users');
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw this.httpError(400, 'Username already exists');
    }
    if (users.some(u => u.email.toLowerCase() === email)) {
      throw this.httpError(400, 'Email already exists');
    }
    const newUser: DemoUser = {
      id: await this.db.nextId('users'),
      username,
      email,
      firstName: String(body?.firstName || '').trim(),
      lastName: String(body?.lastName || '').trim(),
      password,
      enabled: true
    };
    await this.db.put('users', newUser);
    return this.ok({ id: newUser.id, username: newUser.username, email: newUser.email });
  }

  private async forgotPassword(body: any): Promise<HttpResponse<any>> {
    const email = String(body?.email || '').trim().toLowerCase();
    const users = await this.db.getAll<DemoUser>('users');
    const user = users.find(u => u.email.toLowerCase() === email);
    if (user) {
      const token = this.randomCode(24);
      user.passwordResetToken = token;
      user.passwordResetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await this.db.put('users', user);

      const msg: DemoInboxMessage = {
        id: await this.db.nextId('demo_inbox'),
        type: 'PASSWORD_RESET',
        recipientEmail: user.email,
        recipientName: `${user.firstName} ${user.lastName}`.trim() || user.username,
        subject: 'Invoice Management System password reset (Simulated)',
        body: `Hello ${user.firstName || user.username},\n\nUse the simulated reset link below to set a new password (expires in 30 minutes).`,
        resetToken: token,
        actionUrl: `/auth?resetToken=${token}`,
        read: false,
        createdAt: new Date().toISOString()
      };
      await this.db.put('demo_inbox', msg);
    }
    return this.ok({ message: 'If that email exists, a simulated reset link was added to Demo Inbox.' });
  }

  private async resetPassword(body: any): Promise<HttpResponse<any>> {
    const token = String(body?.token || '').trim();
    const newPassword = String(body?.newPassword || '');
    if (!token || newPassword.length < 6) {
      throw this.httpError(400, 'Invalid or expired password reset link');
    }
    const users = await this.db.getAll<DemoUser>('users');
    const user = users.find(u => u.passwordResetToken === token);
    if (!user || !user.passwordResetTokenExpiresAt || new Date(user.passwordResetTokenExpiresAt) <= new Date()) {
      throw this.httpError(400, 'Invalid or expired password reset link');
    }
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpiresAt = null;
    await this.db.put('users', user);
    return this.ok({ message: 'Password reset successfully.' });
  }

  private async updateUserProfile(user: DemoUser, body: any): Promise<HttpResponse<any>> {
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email) throw this.httpError(400, 'Email is required');
    const users = await this.db.getAll<DemoUser>('users');
    if (users.some(u => u.id !== user.id && u.email.toLowerCase() === email)) {
      throw this.httpError(400, 'Email already exists');
    }
    user.email = email;
    user.firstName = String(body?.firstName || '').trim();
    user.lastName = String(body?.lastName || '').trim();
    await this.db.put('users', user);
    return this.ok(this.toUserProfile(user));
  }

  private async changeUserPassword(user: DemoUser, body: any): Promise<HttpResponse<any>> {
    if (String(body?.currentPassword || '') !== user.password) {
      throw this.httpError(400, 'Current password is incorrect');
    }
    const next = String(body?.newPassword || '');
    if (next.length < 6) {
      throw this.httpError(400, 'New password must be at least 6 characters');
    }
    user.password = next;
    await this.db.put('users', user);
    return this.ok({ message: 'Password changed successfully.' });
  }

  // --- Dashboard (Integer-cent accuracy matching DashboardService.java) ---
  private async getDashboard(user: DemoUser): Promise<HttpResponse<any>> {
    const allInvoices = (await this.db.getAll<DemoInvoice>('invoices')).filter(i => i.userId === user.id);
    const clients = (await this.db.getAll<DemoClient>('clients')).filter(c => c.userId === user.id);
    const today = new Date().toISOString().slice(0, 10);

    let invoicedCents = 0;
    let paidCents = 0;
    let outstandingCents = 0;
    let overdueCents = 0;
    let draftCents = 0;
    let cancelledCents = 0;
    let overdueCount = 0;

    const statusCounts: Record<InvoiceStatus, number> = {
      DRAFT: 0,
      SENT: 0,
      PAID: 0,
      OVERDUE: 0,
      CANCELLED: 0
    };

    const monthMap = new Map<string, { invoicedCents: number; paidCents: number }>();

    for (const inv of allInvoices) {
      const cents = Math.round(Number(inv.totalAmount || 0) * 100);
      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;

      if (inv.status === 'PAID') {
        paidCents += cents;
        invoicedCents += cents;
      } else if (inv.status === 'SENT') {
        invoicedCents += cents;
        outstandingCents += cents;
        if (inv.dueDate && inv.dueDate < today) {
          overdueCents += cents;
          overdueCount++;
        }
      } else if (inv.status === 'OVERDUE') {
        invoicedCents += cents;
        outstandingCents += cents;
        overdueCents += cents;
        overdueCount++;
      } else if (inv.status === 'DRAFT') {
        draftCents += cents;
      } else if (inv.status === 'CANCELLED') {
        cancelledCents += cents;
      }

      if (inv.issueDate && inv.status !== 'DRAFT' && inv.status !== 'CANCELLED') {
        const ym = inv.issueDate.slice(0, 7);
        const cur = monthMap.get(ym) || { invoicedCents: 0, paidCents: 0 };
        cur.invoicedCents += cents;
        if (inv.status === 'PAID') cur.paidCents += cents;
        monthMap.set(ym, cur);
      }
    }

    const monthlyTotals = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([ym, vals]) => {
        const [y, m] = ym.split('-').map(Number);
        const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return {
          month: label,
          invoiced: vals.invoicedCents / 100,
          paid: vals.paidCents / 100
        };
      });

    const sortedRecent = [...allInvoices]
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.id - a.id)
      .slice(0, 5);
    const recentInvoices = await this.hydrateInvoices(sortedRecent);

    return this.ok({
      totalInvoices: allInvoices.length,
      totalClients: clients.length,
      totalAmount: invoicedCents / 100,
      invoicedAmount: invoicedCents / 100,
      paidAmount: paidCents / 100,
      outstandingAmount: outstandingCents / 100,
      overdueAmount: overdueCents / 100,
      draftAmount: draftCents / 100,
      cancelledAmount: cancelledCents / 100,
      overdueInvoices: overdueCount,
      statusCounts,
      monthlyTotals,
      recentInvoices
    });
  }

  // --- Clients ---
  private async createClient(user: DemoUser, body: any): Promise<HttpResponse<any>> {
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    if (name.length < 3 || !email) {
      throw this.httpError(400, 'Client name (min 3 chars) and valid email are required');
    }
    const clients = await this.db.getAll<DemoClient>('clients');
    if (clients.some(c => c.userId === user.id && c.email.toLowerCase() === email)) {
      throw this.httpError(400, 'A client with this email already exists');
    }
    const created: DemoClient = {
      id: await this.db.nextId('clients'),
      userId: user.id,
      name,
      email,
      phoneNumber: String(body?.phoneNumber || '').trim(),
      address: String(body?.address || '').trim()
    };
    await this.db.put('clients', created);
    return this.ok(created);
  }

  private async updateClient(id: number, user: DemoUser, body: any): Promise<HttpResponse<any>> {
    const existing = await this.requireOwnedClient(id, user);
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    if (name.length < 3 || !email) {
      throw this.httpError(400, 'Client name and valid email are required');
    }
    const clients = await this.db.getAll<DemoClient>('clients');
    if (clients.some(c => c.userId === user.id && c.id !== id && c.email.toLowerCase() === email)) {
      throw this.httpError(400, 'A client with this email already exists');
    }
    existing.name = name;
    existing.email = email;
    existing.phoneNumber = String(body?.phoneNumber || '').trim();
    existing.address = String(body?.address || '').trim();
    await this.db.put('clients', existing);

    const accounts = await this.db.getAll<DemoPortalAccount>('portal_accounts');
    const portalAcc = accounts.find(a => a.clientId === id);
    if (portalAcc && portalAcc.email.toLowerCase() !== email) {
      if (accounts.some(a => a.id !== portalAcc.id && a.email.toLowerCase() === email)) {
        throw this.httpError(400, 'Another client portal account already uses this email');
      }
      portalAcc.email = email;
      await this.db.put('portal_accounts', portalAcc);
    }
    return this.ok(existing);
  }

  private async deleteClient(id: number, user: DemoUser): Promise<HttpResponse<any>> {
    await this.requireOwnedClient(id, user);
    const invoices = await this.db.getAll<DemoInvoice>('invoices');
    if (invoices.some(i => i.clientId === id && i.userId === user.id)) {
      throw this.httpError(400, 'Cannot delete client with existing invoices. Delete or reassign their invoices first.');
    }
    const invitations = (await this.db.getAll<DemoInvitation>('invitations')).filter(inv => inv.clientId === id);
    for (const inv of invitations) {
      await this.db.deleteById('invitations', inv.id);
    }
    const accounts = (await this.db.getAll<DemoPortalAccount>('portal_accounts')).filter(acc => acc.clientId === id);
    for (const acc of accounts) {
      await this.db.deleteById('portal_accounts', acc.id);
    }
    await this.db.deleteById('clients', id);
    return this.ok(null, 204);
  }

  // --- Invoices ---
  private async findInvoices(user: DemoUser, params: URLSearchParams): Promise<HttpResponse<any>> {
    const invoiceNumber = (params.get('invoiceNumber') || '').trim().toLowerCase();
    const status = params.get('status') || '';
    const clientIdParam = params.get('clientId');
    const startDate = params.get('startDate') || '';
    const endDate = params.get('endDate') || '';
    const minAmount = params.get('minAmount') ? Number(params.get('minAmount')) : null;
    const maxAmount = params.get('maxAmount') ? Number(params.get('maxAmount')) : null;
    const page = Math.max(0, Number(params.get('page') || 0));
    const size = Math.min(Math.max(1, Number(params.get('size') || 10)), 100);
    const sortBy = params.get('sortBy') || 'issueDate';
    const sortDir = params.get('sortDir') === 'asc' ? 1 : -1;

    let list = (await this.db.getAll<DemoInvoice>('invoices')).filter(i => i.userId === user.id);

    if (invoiceNumber) list = list.filter(i => i.invoiceNumber.toLowerCase().includes(invoiceNumber));
    if (status) list = list.filter(i => i.status === status);
    if (clientIdParam) list = list.filter(i => i.clientId === Number(clientIdParam));
    if (startDate) list = list.filter(i => i.issueDate >= startDate);
    if (endDate) list = list.filter(i => i.issueDate <= endDate);
    if (minAmount !== null && !Number.isNaN(minAmount)) list = list.filter(i => i.totalAmount >= minAmount);
    if (maxAmount !== null && !Number.isNaN(maxAmount)) list = list.filter(i => i.totalAmount <= maxAmount);

    list.sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
      return String(av || '').localeCompare(String(bv || '')) * sortDir;
    });

    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size);
    const slice = list.slice(page * size, page * size + size);
    const content = await this.hydrateInvoices(slice);

    return this.ok({ content, totalElements, totalPages, number: page, size });
  }

  private async createInvoice(user: DemoUser, body: any): Promise<HttpResponse<any>> {
    this.validateInvoicePayload(body);
    const invoiceNumber = String(body.invoiceNumber).trim();
    const allInvoices = await this.db.getAll<DemoInvoice>('invoices');
    if (allInvoices.some(i => i.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase())) {
      throw this.httpError(400, 'Invoice number already exists');
    }
    const client = await this.requireOwnedClient(Number(body.client.id), user);
    const created: DemoInvoice = {
      id: await this.db.nextId('invoices'),
      userId: user.id,
      clientId: client.id,
      invoiceNumber,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      totalAmount: Math.round(Number(body.totalAmount) * 100) / 100,
      status: body.status
    };
    await this.db.put('invoices', created);
    return this.ok({ ...created, client });
  }

  private async updateInvoice(id: number, user: DemoUser, body: any): Promise<HttpResponse<any>> {
    const existing = await this.requireOwnedInvoice(id, user);
    this.validateInvoicePayload(body);
    const invoiceNumber = String(body.invoiceNumber).trim();
    const allInvoices = await this.db.getAll<DemoInvoice>('invoices');
    if (allInvoices.some(i => i.id !== id && i.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase())) {
      throw this.httpError(400, 'Invoice number already exists');
    }
    const client = await this.requireOwnedClient(Number(body.client.id), user);
    existing.invoiceNumber = invoiceNumber;
    existing.issueDate = body.issueDate;
    existing.dueDate = body.dueDate;
    existing.totalAmount = Math.round(Number(body.totalAmount) * 100) / 100;
    existing.status = body.status;
    existing.clientId = client.id;
    await this.db.put('invoices', existing);
    return this.ok({ ...existing, client });
  }

  private async deleteInvoice(id: number, user: DemoUser): Promise<HttpResponse<any>> {
    await this.requireOwnedInvoice(id, user);
    await this.db.deleteById('invoices', id);
    return this.ok(null, 204);
  }

  private validateInvoicePayload(body: any): void {
    if (!body || !String(body.invoiceNumber || '').trim()) {
      throw this.httpError(400, 'Invoice number is required');
    }
    if (!body.issueDate || !body.dueDate) {
      throw this.httpError(400, 'Issue date and due date are required');
    }
    if (body.dueDate < body.issueDate) {
      throw this.httpError(400, 'Due date cannot be before issue date');
    }
    const amount = Number(body.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw this.httpError(400, 'Total amount must be greater than 0');
    }
    if (!body.status) {
      throw this.httpError(400, 'Invoice status is required');
    }
    if (!body.client?.id) {
      throw this.httpError(400, 'Invoice must be associated with a client');
    }
  }

  // --- Client Invitations & Portal Access ---
  private async inviteClient(clientId: number, user: DemoUser): Promise<any> {
    const client = await this.requireOwnedClient(clientId, user);
    const accounts = await this.db.getAll<DemoPortalAccount>('portal_accounts');
    if (accounts.some(a => a.clientId === client.id)) {
      throw this.httpError(400, 'This client already has portal access');
    }
    const nowIso = new Date().toISOString();
    const open = (await this.db.getAll<DemoInvitation>('invitations'))
      .filter(i => i.clientId === client.id && !i.usedAt && i.expiresAt > nowIso)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (open.length > 0) {
      return {
        clientId: client.id,
        email: client.email,
        invitationCode: open[0].invitationCode,
        expiresAt: open[0].expiresAt
      };
    }
    return this.createInvitation(client, user);
  }

  private async regenerateInvitation(clientId: number, user: DemoUser): Promise<any> {
    const client = await this.requireOwnedClient(clientId, user);
    const accounts = await this.db.getAll<DemoPortalAccount>('portal_accounts');
    if (accounts.some(a => a.clientId === client.id)) {
      throw this.httpError(400, 'This client already has portal access');
    }
    const nowIso = new Date().toISOString();
    const open = (await this.db.getAll<DemoInvitation>('invitations')).filter(i => i.clientId === client.id && !i.usedAt);
    for (const inv of open) {
      inv.usedAt = nowIso;
    }
    await this.db.putAll('invitations', open);
    const created = await this.createInvitation(client, user);

    await this.db.put('demo_inbox', {
      id: await this.db.nextId('demo_inbox'),
      type: 'REGENERATION',
      recipientEmail: client.email,
      recipientName: client.name,
      subject: 'Updated client portal invitation code (Simulated)',
      body: `Hello ${client.name},\n\nYour previous invitation code was invalidated and replaced with ${created.invitationCode}.`,
      invitationCode: created.invitationCode,
      actionUrl: '/auth?accountType=client',
      read: false,
      createdAt: nowIso
    });

    return created;
  }

  private async sendInvitation(clientId: number, user: DemoUser): Promise<any> {
    const invite = await this.inviteClient(clientId, user);
    const client = await this.requireOwnedClient(clientId, user);
    const nowIso = new Date().toISOString();

    const invitations = (await this.db.getAll<DemoInvitation>('invitations'))
      .filter(i => i.clientId === client.id && !i.usedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (invitations[0]) {
      invitations[0].sentAt = nowIso;
      await this.db.put('invitations', invitations[0]);
    }

    await this.db.put('demo_inbox', {
      id: await this.db.nextId('demo_inbox'),
      type: 'INVITATION',
      recipientEmail: client.email,
      recipientName: client.name,
      subject: 'Invoice Management System client portal invitation (Simulated)',
      body: `Hello ${client.name},\n\nYou have been invited to access your invoices in the client portal.\n\nEmail: ${client.email}\nInvitation code: ${invite.invitationCode}\nExpires: ${invite.expiresAt}`,
      invitationCode: invite.invitationCode,
      actionUrl: '/auth?accountType=client',
      read: false,
      createdAt: nowIso
    });

    return invite;
  }

  private async createInvitation(client: DemoClient, user: DemoUser): Promise<any> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const invitationCode = this.randomCode(8);
    const inv: DemoInvitation = {
      id: await this.db.nextId('invitations'),
      clientId: client.id,
      createdByUserId: user.id,
      invitationCode,
      createdAt: now.toISOString(),
      expiresAt,
      usedAt: null,
      sentAt: null
    };
    await this.db.put('invitations', inv);
    return { clientId: client.id, email: client.email, invitationCode, expiresAt };
  }

  private async getClientPortalAccess(clientId: number, user: DemoUser): Promise<any> {
    const client = await this.requireOwnedClient(clientId, user);
    const acc = (await this.db.getAll<DemoPortalAccount>('portal_accounts')).find(a => a.clientId === client.id);
    return acc
      ? { clientId: client.id, portalAccountExists: true, enabled: acc.enabled }
      : { clientId: client.id, portalAccountExists: false, enabled: false };
  }

  private async setClientPortalAccess(clientId: number, user: DemoUser, enabled: boolean): Promise<any> {
    const client = await this.requireOwnedClient(clientId, user);
    const acc = (await this.db.getAll<DemoPortalAccount>('portal_accounts')).find(a => a.clientId === client.id);
    if (!acc) {
      throw this.httpError(400, 'This client has not activated portal access yet');
    }
    acc.enabled = enabled;
    await this.db.put('portal_accounts', acc);
    return { clientId: client.id, portalAccountExists: true, enabled: acc.enabled };
  }

  private async activateClient(body: any): Promise<HttpResponse<any>> {
    const email = String(body?.email || '').trim().toLowerCase();
    const code = String(body?.invitationCode || '').trim().toUpperCase();
    const password = String(body?.password || '');
    if (!email || !code || password.length < 6) {
      throw this.httpError(400, 'Valid email, invitation code, and password (min 6 chars) are required');
    }

    const clients = await this.db.getAll<DemoClient>('clients');
    const matchingClientIds = new Set(clients.filter(c => c.email.toLowerCase() === email).map(c => c.id));
    const nowIso = new Date().toISOString();

    const invitations = (await this.db.getAll<DemoInvitation>('invitations'))
      .filter(i => matchingClientIds.has(i.clientId) && !i.usedAt && i.expiresAt > nowIso && i.invitationCode === code)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const invitation = invitations[0];
    if (!invitation) {
      throw this.httpError(400, 'Invalid or expired invitation code');
    }

    const client = clients.find(c => c.id === invitation.clientId)!;
    const accounts = await this.db.getAll<DemoPortalAccount>('portal_accounts');
    if (accounts.some(a => a.clientId === client.id)) {
      throw this.httpError(400, 'This client portal account is already active');
    }
    if (accounts.some(a => a.email.toLowerCase() === client.email.toLowerCase())) {
      throw this.httpError(400, 'A client portal account already exists for this email');
    }

    const account: DemoPortalAccount = {
      id: await this.db.nextId('portal_accounts'),
      clientId: client.id,
      email: client.email.toLowerCase(),
      password,
      enabled: true,
      createdAt: nowIso
    };
    await this.db.put('portal_accounts', account);

    invitation.usedAt = nowIso;
    await this.db.put('invitations', invitation);

    const token = this.createDemoJwt({
      sub: account.email,
      accountType: 'CLIENT',
      clientAccountId: account.id,
      clientId: client.id
    });
    return this.ok({ token, clientId: client.id, clientName: client.name, email: account.email });
  }

  private async loginClient(body: any): Promise<HttpResponse<any>> {
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const account = (await this.db.getAll<DemoPortalAccount>('portal_accounts'))
      .find(a => a.email.toLowerCase() === email);
    if (!account) {
      throw this.httpError(401, 'Invalid email or password');
    }
    if (!account.enabled) {
      throw this.httpError(401, 'Your client portal account is blocked. Please contact your provider.');
    }
    if (account.password !== password) {
      throw this.httpError(401, 'Invalid email or password');
    }
    account.lastLogin = new Date().toISOString();
    await this.db.put('portal_accounts', account);
    const client = await this.db.getById<DemoClient>('clients', account.clientId);
    const token = this.createDemoJwt({
      sub: account.email,
      accountType: 'CLIENT',
      clientAccountId: account.id,
      clientId: account.clientId
    });
    return this.ok({ token, clientId: account.clientId, clientName: client?.name || '', email: account.email });
  }

  private async handleClientPortal(method: string, path: string, body: any, authHeader: string | null): Promise<HttpResponse<any>> {
    const { account, client } = await this.requireClientAccount(authHeader);

    if (path === '/api/client-portal/me' && method === 'GET') {
      return this.ok({
        id: client.id,
        name: client.name,
        email: client.email,
        phoneNumber: client.phoneNumber,
        address: client.address
      });
    }
    if (path === '/api/client-portal/me' && method === 'PUT') {
      const name = String(body?.name || '').trim();
      if (name.length < 3) throw this.httpError(400, 'Name must be at least 3 characters');
      // Explicitly restrict writable fields (email and enabled cannot be altered by client)
      client.name = name;
      client.phoneNumber = String(body?.phoneNumber || '').trim();
      client.address = String(body?.address || '').trim();
      await this.db.put('clients', client);
      return this.ok({
        id: client.id,
        name: client.name,
        email: client.email,
        phoneNumber: client.phoneNumber,
        address: client.address
      });
    }
    if (path === '/api/client-portal/invoices' && method === 'GET') {
      const list = (await this.db.getAll<DemoInvoice>('invoices')).filter(i => i.clientId === client.id);
      return this.ok(await this.hydrateInvoices(list));
    }
    if (path === '/api/client-portal/invoices/pdf' && method === 'GET') {
      const list = (await this.db.getAll<DemoInvoice>('invoices')).filter(i => i.clientId === client.id);
      if (list.length === 0) throw this.httpError(404, 'No invoices found');
      const blob = await this.pdfService.generateClientInvoicesPdf(client, list);
      return this.ok(blob);
    }
    const invPdfMatch = path.match(/^\/api\/client-portal\/invoices\/(\d+)\/pdf$/);
    if (invPdfMatch && method === 'GET') {
      const inv = (await this.db.getAll<DemoInvoice>('invoices'))
        .find(i => i.id === Number(invPdfMatch[1]) && i.clientId === client.id);
      if (!inv) throw this.httpError(404, 'Invoice not found');
      const issuer = await this.db.getById<DemoUser>('users', inv.userId);
      const blob = await this.pdfService.generateInvoicePdf({ ...inv, client }, issuer);
      return this.ok(blob);
    }
    const invMatch = path.match(/^\/api\/client-portal\/invoices\/(\d+)$/);
    if (invMatch && method === 'GET') {
      const inv = (await this.db.getAll<DemoInvoice>('invoices'))
        .find(i => i.id === Number(invMatch[1]) && i.clientId === client.id);
      if (!inv) throw this.httpError(404, 'Invoice not found');
      return this.ok({ ...inv, client });
    }
    throw this.httpError(404, `Client portal endpoint not found: ${path}`);
  }

  // --- Auth Helpers ---
  private async requireBusinessUser(authHeader: string | null): Promise<DemoUser> {
    const payload = this.parseDemoJwt(authHeader);
    if (!payload || payload['accountType'] !== 'USER') {
      throw this.httpError(401, 'Unauthorized');
    }
    const users = await this.db.getAll<DemoUser>('users');
    const user = users.find(u => u.id === payload['userId'] || u.username === payload['sub']);
    if (!user || !user.enabled) {
      throw this.httpError(401, 'Unauthorized');
    }
    return user;
  }

  private async requireClientAccount(authHeader: string | null): Promise<{ account: DemoPortalAccount; client: DemoClient }> {
    const payload = this.parseDemoJwt(authHeader);
    if (!payload || payload['accountType'] !== 'CLIENT') {
      throw this.httpError(401, 'Invalid client authorization token');
    }
    const account = await this.db.getById<DemoPortalAccount>('portal_accounts', Number(payload['clientAccountId']));
    if (!account) {
      throw this.httpError(401, 'Client portal account not found');
    }
    if (!account.enabled) {
      throw this.httpError(401, 'Your client portal account is blocked. Please contact your provider.');
    }
    const client = await this.db.getById<DemoClient>('clients', account.clientId);
    if (!client) {
      throw this.httpError(401, 'Client not found');
    }
    return { account, client };
  }

  private async requireOwnedClient(clientId: number, user: DemoUser): Promise<DemoClient> {
    const client = await this.db.getById<DemoClient>('clients', clientId);
    if (!client || client.userId !== user.id) {
      throw this.httpError(400, 'Client not found or does not belong to user');
    }
    return client;
  }

  private async requireOwnedInvoice(invoiceId: number, user: DemoUser): Promise<DemoInvoice> {
    const invoice = await this.db.getById<DemoInvoice>('invoices', invoiceId);
    if (!invoice || invoice.userId !== user.id) {
      throw this.httpError(400, 'Invoice not found or does not belong to the user');
    }
    return invoice;
  }

  private async hydrateInvoices(invoices: DemoInvoice[]): Promise<any[]> {
    const clients = await this.db.getAll<DemoClient>('clients');
    const clientMap = new Map(clients.map(c => [c.id, c]));
    return invoices.map(inv => ({
      ...inv,
      client: clientMap.get(inv.clientId) || null
    }));
  }

  private toUserProfile(user: DemoUser): any {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }

  private createDemoJwt(claims: Record<string, any>): string {
    const now = Math.floor(Date.now() / 1000);
    const header = this.base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT', demo: true }));
    const payload = this.base64Url(JSON.stringify({ ...claims, iat: now, exp: now + 36000 }));
    return `${header}.${payload}.demo-local-token`;
  }

  private parseDemoJwt(authHeader: string | null): Record<string, any> | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
      const token = authHeader.slice(7);
      const part = token.split('.')[1];
      const norm = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = norm.padEnd(norm.length + (4 - (norm.length % 4)) % 4, '=');
      const payload = JSON.parse(atob(padded));
      if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  private base64Url(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private randomCode(len: number): string {
    let out = '';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) {
      out += CODE_ALPHABET[arr[i] % CODE_ALPHABET.length];
    }
    return out;
  }

  private ok(body: any, status = 200): HttpResponse<any> {
    return new HttpResponse({ status, body });
  }

  private httpError(status: number, message: string): HttpErrorResponse {
    return new HttpErrorResponse({
      status,
      error: { message, error: message }
    });
  }
}
