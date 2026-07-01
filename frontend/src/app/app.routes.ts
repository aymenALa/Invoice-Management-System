import { Routes } from '@angular/router';
import { AuthFormComponent } from './components/auth/auth-form/auth-form.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InvoiceListComponent } from './components/invoices/invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './components/invoices/invoice-form/invoice-form.component';
import { InvoiceDetailComponent } from './components/invoices/invoice-detail/invoice-detail.component';
import { ClientInvoicesComponent } from './components/client-invoices/client-invoices.component';
import { ClientsListComponent } from './components/clients-list/clients-list.component';
import { ClientPortalComponent } from './components/client-portal/client-portal.component';
import { LandingComponent } from './components/landing/landing.component';
import { authGuard } from './guards/auth.guard';
import { clientAuthGuard } from './guards/client-auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth', component: AuthFormComponent, canActivate: [noAuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'invoices', component: InvoiceListComponent, canActivate: [authGuard] },
  { path: 'invoices/new', component: InvoiceFormComponent, canActivate: [authGuard] },
  { path: 'invoices/:id', component: InvoiceDetailComponent, canActivate: [authGuard] },
  { path: 'invoices/:id/edit', component: InvoiceFormComponent, canActivate: [authGuard] },
  { path: 'clients/:id/invoices', component: ClientInvoicesComponent, canActivate: [authGuard] },
  { path: 'clients', component: ClientsListComponent, canActivate: [authGuard] },
  { path: 'client-portal', component: ClientPortalComponent, canActivate: [clientAuthGuard] },
  { path: '**', redirectTo: '/', pathMatch: 'full' }
];
