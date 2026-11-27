import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { ClientService } from '../../services/client.service';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboardData: any = {};
  recentInvoices: any[] = [];
  barChart: Chart<any> | null = null;
  pieChart: Chart<any> | null = null;
  clients: any[] = [];
  recentClients: any[] = [];
  totalInvoices = 0;
  totalClients = 0;
  invoicedAmount = 0;
  paidAmount = 0;
  outstandingAmount = 0;
  overdueAmount = 0;
  overdueInvoices = 0;
  draftAmount = 0;
  cancelledAmount = 0;
  username: string | null = null;
  isLoading = true;
  errorMessage = '';
  private sub = new Subscription();

  constructor(
    private dashboardService: DashboardService,
    private clientService: ClientService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    this.sub.add(
      this.authService.displayName$().subscribe(name => {
        if (name) this.username = name;
      })
    );
    this.loadDashboardData();
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.barChart?.destroy();
    this.pieChart?.destroy();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.errorMessage = '';
    this.dashboardService.getDashboardData().subscribe({
      next: data => {
        this.dashboardData = data || {};
        this.recentInvoices = data?.recentInvoices || [];
        this.totalInvoices = data?.totalInvoices || 0;
        this.totalClients = data?.totalClients ?? this.clients.length;
        this.invoicedAmount = Number(data?.invoicedAmount ?? data?.totalAmount ?? 0);
        this.paidAmount = Number(data?.paidAmount ?? 0);
        this.outstandingAmount = Number(data?.outstandingAmount ?? 0);
        this.overdueAmount = Number(data?.overdueAmount ?? 0);
        this.overdueInvoices = Number(data?.overdueInvoices ?? 0);
        this.draftAmount = Number(data?.draftAmount ?? 0);
        this.cancelledAmount = Number(data?.cancelledAmount ?? 0);
        this.isLoading = false;
        setTimeout(() => this.initCharts(), 0);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Could not load financial dashboard metrics.';
      }
    });
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: data => {
        this.clients = data || [];
        this.recentClients = this.clients.slice(0, 5);
        if (!this.totalClients) {
          this.totalClients = this.clients.length;
        }
      },
      error: () => {}
    });
  }

  viewClientInvoices(clientId: number): void {
    this.router.navigate(['/clients', clientId, 'invoices']);
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'PAID': return 'ims-badge ims-badge-paid';
      case 'SENT': return 'ims-badge ims-badge-sent';
      case 'OVERDUE': return 'ims-badge ims-badge-overdue';
      case 'DRAFT': return 'ims-badge ims-badge-draft';
      default: return 'ims-badge ims-badge-cancelled';
    }
  }

  initCharts() {
    this.initBarChart();
    this.initPieChart();
  }

  initBarChart() {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement | null;
    if (!ctx) return;
    this.barChart?.destroy();

    const monthlyTotals: any[] = this.dashboardData?.monthlyTotals || [];
    const labels = monthlyTotals.length
      ? monthlyTotals.map(m => m.month)
      : this.recentInvoices.map(i => i.invoiceNumber);
    const invoicedSeries = monthlyTotals.length
      ? monthlyTotals.map(m => Number(m.invoiced || 0))
      : this.recentInvoices.map(i => Number(i.totalAmount || 0));
    const paidSeries = monthlyTotals.length
      ? monthlyTotals.map(m => Number(m.paid || 0))
      : this.recentInvoices.map(i => (i.status === 'PAID' ? Number(i.totalAmount || 0) : 0));

    if (!labels.length) return;

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Invoiced',
            data: invoicedSeries,
            backgroundColor: 'rgba(99, 102, 241, 0.75)',
            borderColor: '#6366F1',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Paid',
            data: paidSeries,
            backgroundColor: 'rgba(52, 211, 153, 0.75)',
            borderColor: '#34D399',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94A3B8', font: { size: 12 } }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94A3B8' },
            grid: { color: 'rgba(38, 50, 70, 0.45)' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#94A3B8' },
            grid: { color: 'rgba(38, 50, 70, 0.45)' }
          }
        }
      }
    });
  }

  initPieChart() {
    const ctx = document.getElementById('statusChart') as HTMLCanvasElement | null;
    if (!ctx) return;
    this.pieChart?.destroy();

    const rawCounts: Record<string, number> = this.dashboardData?.statusCounts || {};
    const entries = Object.entries(rawCounts).filter(([, count]) => Number(count) > 0);
    if (!entries.length) return;

    const colorMap: Record<string, string> = {
      PAID: '#34D399',
      SENT: '#6366F1',
      OVERDUE: '#F87171',
      DRAFT: '#FBBF24',
      CANCELLED: '#64748B'
    };

    this.pieChart = new Chart<'doughnut', number[], string>(ctx, {
      type: 'doughnut',
      data: {
        labels: entries.map(([status]) => status),
        datasets: [{
          data: entries.map(([, count]) => Number(count)),
          backgroundColor: entries.map(([status]) => colorMap[status] || '#818CF8'),
          borderColor: '#131C2B',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94A3B8', padding: 14, font: { size: 12 } }
          }
        }
      }
    });
  }
}
