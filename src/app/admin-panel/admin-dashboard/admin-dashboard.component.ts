import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { isOperationalIssueStatus, isOperationalQueueIssue } from '../admin-operational-status.util';

interface AdminStats {
  totalProjects: number;
  totalUsers: number;
  monthlyRevenue: number;
  planDistribution: Record<string, number>;
}

interface OperationalOverview {
  status: string;
  statusLabel: string;
  servicesOk: number;
  servicesTotal: number;
  channelsOk: number;
  channelsTotal: number;
  queuesOk: number;
  queuesTotal: number;
  failures24h: number;
  errors24h: number;
  webhookFailures24h: number;
  alerts: any[];
  criticalAlerts: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats = null;
  isLoading = true;
  errorMessage = '';
  lastUpdated: Date = null;
  operationalOverview: OperationalOverview = null;
  operationalLoading = true;
  operationalUnavailable = false;
  planDisplayNames: Record<string, string> = { free: 'Iniciante', starter: 'Standard', pro: 'Pro', business: 'Enterprise', custom: 'Custom', other: 'Outros' };

  constructor(private adminService: AdminService) { }

  ngOnInit() { this.loadStats(); }

  loadStats() {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadOperationalOverview();
    this.adminService.getStats().subscribe(
      (data) => { this.stats = data; this.lastUpdated = new Date(); this.isLoading = false; },
      () => { this.errorMessage = 'Erro ao carregar estatísticas'; this.isLoading = false; }
    );
  }

  loadOperationalOverview() {
    this.operationalLoading = true;
    this.operationalUnavailable = false;
    forkJoin([
      this.adminService.getHealthSummary(),
      this.adminService.getOperationalMetrics({ range: '24h', bucket: 'hour' })
    ]).subscribe(
      (result) => {
        this.operationalOverview = this.buildOperationalOverview(result[0], result[1]);
        this.operationalLoading = false;
      },
      () => {
        this.operationalOverview = null;
        this.operationalUnavailable = true;
        this.operationalLoading = false;
      }
    );
  }

  buildOperationalOverview(summary: any, metrics: any): OperationalOverview {
    if (!summary) return null;
    const services = Array.isArray(summary.services) ? summary.services : [];
    const channels = Array.isArray(summary.channels) ? summary.channels : [];
    const queues = summary.queues && summary.queues.details && Array.isArray(summary.queues.details.queues)
      ? summary.queues.details.queues
      : [];
    const alerts = Array.isArray(summary.alerts) ? summary.alerts : [];

    return {
      status: summary.overallStatus || 'unknown',
      statusLabel: this.getOperationalStatusLabel(summary.overallStatus),
      servicesOk: services.filter((service) => !isOperationalIssueStatus(service.status)).length,
      servicesTotal: services.length,
      channelsOk: channels.filter((channel) => {
        return !isOperationalIssueStatus(channel.status) &&
          !isOperationalIssueStatus(channel.providerHealth) &&
          !isOperationalIssueStatus(channel.providerStatus);
      }).length,
      channelsTotal: channels.length,
      queuesOk: queues.filter((queue) => !isOperationalQueueIssue(queue)).length,
      queuesTotal: queues.length,
      failures24h: metrics && metrics.events && metrics.events.byStatus ? metrics.events.byStatus.failed || 0 : null,
      errors24h: metrics && metrics.events && metrics.events.byLevel ? metrics.events.byLevel.error || 0 : null,
      webhookFailures24h: metrics && metrics.alerts && metrics.alerts.byType ? metrics.alerts.byType.webhook_failure || 0 : null,
      alerts: alerts.slice(0, 4),
      criticalAlerts: alerts.filter((alert) => alert.severity === 'critical').length
    };
  }

  getOperationalStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ok: 'Operação normal',
      degraded: 'Requer atenção',
      down: 'Indisponível',
      unknown: 'Sem diagnóstico'
    };
    return labels[status] || 'Sem diagnóstico';
  }

  getOperationalStatusClass(status: string): string {
    if (status === 'ok') return 'admin-status-success';
    if (status === 'degraded') return 'admin-status-warning';
    if (status === 'down') return 'admin-status-danger';
    return 'admin-status-muted';
  }

  getPlanKeys(): string[] {
    if (!this.stats) return [];
    return Object.keys(this.stats.planDistribution);
  }

  getUsersPerProject(): number {
    if (!this.stats || !this.stats.totalProjects) return 0;
    return this.stats.totalUsers / this.stats.totalProjects;
  }

  getActivePlanCount(): number {
    return this.getPlanKeys().filter((key) => this.stats.planDistribution[key] > 0).length;
  }

  getPlanPercentage(key: string): number {
    if (!this.stats || !this.stats.totalProjects) return 0;
    return (this.stats.planDistribution[key] / this.stats.totalProjects) * 100;
  }

  getLargestPlanKey(): string {
    return this.getPlanKeys().reduce((largest, key) => {
      return this.stats.planDistribution[key] > (this.stats.planDistribution[largest] || 0) ? key : largest;
    }, '');
  }
}
