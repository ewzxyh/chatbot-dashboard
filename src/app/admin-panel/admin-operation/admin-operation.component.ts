import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-operation',
  templateUrl: './admin-operation.component.html',
  styleUrls: ['./admin-operation.component.scss']
})
export class AdminOperationComponent implements OnInit {
  summary: any = null;
  metrics: any = null;
  metricRows: any[] = [];
  events: any[] = [];
  isLoading = true;
  isLoadingMetrics = false;
  isLoadingEvents = false;
  isTestingStorage = false;
  testingChannelKey = '';
  channelTestResults: any = {};
  errorMessage = '';
  metricFilters: any = {
    range: '24h',
    bucket: 'hour',
    channel: '',
    project_id: ''
  };
  eventFilters: any = {
    channel: '',
    level: '',
    project_id: ''
  };

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.loadSummary();
    this.loadMetrics();
    this.loadEvents();
  }

  loadSummary() {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getHealthSummary().subscribe(
      (data) => {
        this.summary = data;
        this.isLoading = false;
      },
      () => {
        this.errorMessage = 'Erro ao carregar status operacional';
        this.isLoading = false;
      }
    );
  }

  loadEvents() {
    this.isLoadingEvents = true;
    this.adminService.getOperationalEvents(this.eventFilters).subscribe(
      (result) => {
        this.events = result && result.data ? result.data : [];
        this.isLoadingEvents = false;
      },
      () => {
        this.events = [];
        this.isLoadingEvents = false;
      }
    );
  }

  loadMetrics() {
    this.isLoadingMetrics = true;
    this.adminService.getOperationalMetrics(this.metricFilters).subscribe(
      (result) => {
        this.metrics = result;
        this.metricRows = this.mergeMetricRows(result);
        this.isLoadingMetrics = false;
      },
      () => {
        this.metrics = null;
        this.metricRows = [];
        this.isLoadingMetrics = false;
      }
    );
  }

  onMetricRangeChange() {
    if (this.metricFilters.range === '24h') {
      this.metricFilters.bucket = 'hour';
    } else if (!this.metricFilters.bucket) {
      this.metricFilters.bucket = 'day';
    }
    this.loadMetrics();
  }

  mergeMetricRows(metrics: any): any[] {
    if (!metrics) return [];
    const alertByBucket = {};
    const eventRows = metrics.events && metrics.events.byBucket ? metrics.events.byBucket : [];
    const alertRows = metrics.alerts && metrics.alerts.byBucket ? metrics.alerts.byBucket : [];

    alertRows.forEach((row) => {
      alertByBucket[row.bucketStart] = row;
    });

    const rows = eventRows.map((row) => {
      const alertRow = alertByBucket[row.bucketStart] || {};
      return {
        bucketStart: row.bucketStart,
        events: row.count || 0,
        errors: row.errors || 0,
        warnings: row.warnings || 0,
        failed: row.failed || 0,
        alerts: alertRow.count || 0,
        criticalAlerts: alertRow.critical || 0,
        openAlerts: alertRow.open || 0
      };
    });

    alertRows.forEach((row) => {
      const exists = rows.some((eventRow) => eventRow.bucketStart === row.bucketStart);
      if (!exists) {
        rows.push({
          bucketStart: row.bucketStart,
          events: 0,
          errors: 0,
          warnings: 0,
          failed: 0,
          alerts: row.count || 0,
          criticalAlerts: row.critical || 0,
          openAlerts: row.open || 0
        });
      }
    });

    return rows.sort((a, b) => {
      return new Date(b.bucketStart).getTime() - new Date(a.bucketStart).getTime();
    });
  }

  channelKey(channel: any): string {
    if (!channel) return '';
    return channel.channel + ':' + (channel.integrationDocId || channel.integrationId || '');
  }

  testChannel(channel: any) {
    if (!channel) return;
    const integrationId = channel.integrationDocId || channel.integrationId;
    const key = this.channelKey(channel);
    this.testingChannelKey = key;
    this.channelTestResults[key] = null;

    this.adminService.testChannelConnection(channel.channel, integrationId).subscribe(
      (response) => {
        const result = response && response.result ? response.result : response;
        this.channelTestResults[key] = result;
        this.testingChannelKey = '';
        this.mergeChannelDiagnostic(channel, result);
        this.loadEvents();
      },
      () => {
        this.channelTestResults[key] = {
          providerHealth: 'down',
          providerReason: 'test_failed'
        };
        this.testingChannelKey = '';
      }
    );
  }

  testStorage() {
    if (this.isTestingStorage) return;
    this.isTestingStorage = true;
    this.adminService.testStorageConnection().subscribe(
      (response) => {
        const result = response && response.result ? response.result : response;
        this.mergeStorageResult(result);
        this.isTestingStorage = false;
        this.loadSummary();
        this.loadEvents();
        this.loadMetrics();
      },
      () => {
        this.mergeStorageResult({
          name: 'storage',
          label: 'Storage',
          status: 'down',
          details: { reason: 'test_failed' }
        });
        this.isTestingStorage = false;
      }
    );
  }

  mergeStorageResult(result: any) {
    if (!this.summary || !this.summary.services || !result) return;
    const index = this.summary.services.findIndex((service) => service.name === 'storage');
    if (index === -1) {
      this.summary.services.push(result);
      return;
    }
    this.summary.services[index] = Object.assign({}, this.summary.services[index], result);
  }

  mergeChannelDiagnostic(channel: any, result: any) {
    if (!channel || !result) return;
    channel.status = result.providerHealth || result.status || channel.status;
    channel.providerHealth = result.providerHealth || result.status;
    channel.providerStatus = result.providerStatus;
    channel.providerReason = result.providerReason;
    channel.providerCode = result.providerCode;
    channel.providerCheckedAt = result.providerCheckedAt;
    channel.providerLatencyMs = result.providerLatencyMs;
    channel.providerError = result.providerError;
    channel.qualityRating = result.qualityRating;
    channel.nameStatus = result.nameStatus;
    channel.canSendNewMessages = result.canSendNewMessages;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      ok: 'OK',
      degraded: 'Degradado',
      down: 'Indisponivel',
      unknown: 'Sem config',
      skipped: 'Ignorado',
      failed: 'Falhou',
      success: 'Sucesso',
      active: 'Ativo',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      restricted: 'Restrito',
      flagged: 'Sinalizado',
      banned: 'Banido',
      bannedm: 'Banido',
      disabled: 'Desabilitado'
    };
    const key = status ? String(status).toLowerCase() : status;
    return labels[key] || status || 'N/A';
  }

  getStatusClass(status: string): string {
    const normalized = status ? String(status).toLowerCase() : '';
    if (normalized === 'ok' || normalized === 'success' || normalized === 'active' || normalized === 'connected' || normalized === 'green') return 'status-ok';
    if (normalized === 'degraded' || normalized === 'warn' || normalized === 'skipped' || normalized === 'restricted' || normalized === 'flagged' || normalized === 'rate_limited' || normalized === 'capped' || normalized === 'yellow') return 'status-warn';
    if (normalized === 'down' || normalized === 'error' || normalized === 'failed' || normalized === 'disconnected' || normalized === 'banned' || normalized === 'bannedm' || normalized === 'disabled' || normalized === 'red') return 'status-error';
    return 'status-unknown';
  }

  formatDate(value: string): string {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString();
  }

  formatBucket(value: string): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (this.metricFilters.bucket === 'day') {
      return date.toLocaleDateString();
    }
    return date.toLocaleString();
  }

  metricCount(group: string, collection: string, key: string): number {
    if (!this.metrics || !this.metrics[group] || !this.metrics[group][collection]) return 0;
    return this.metrics[group][collection][key] || 0;
  }

  topMetricItems(group: string, collection: string): any[] {
    if (!this.metrics || !this.metrics[group] || !this.metrics[group][collection]) return [];
    return Object.keys(this.metrics[group][collection])
      .map((key) => ({ key, count: this.metrics[group][collection][key] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  serviceDetail(service: any): string {
    if (!service || !service.details) return '';
    if (service.details.reason) return service.details.reason;
    if (service.details.error) return service.details.error;
    if (service.name === 'server') return 'uptime ' + service.details.uptimeSeconds + 's';
    if (service.latencyMs !== null && service.latencyMs !== undefined) return service.latencyMs + ' ms';
    return '';
  }

  providerDetail(channel: any): string {
    if (!channel) return '';
    const parts = [];
    if (channel.providerStatus) parts.push('provider: ' + channel.providerStatus);
    if (channel.qualityRating) parts.push('qualidade: ' + channel.qualityRating);
    if (channel.nameStatus) parts.push('nome: ' + channel.nameStatus);
    if (channel.canSendNewMessages === false) parts.push('envio limitado');
    if (channel.providerLatencyMs !== null && channel.providerLatencyMs !== undefined) parts.push(channel.providerLatencyMs + ' ms');
    return parts.join(' | ');
  }
}
