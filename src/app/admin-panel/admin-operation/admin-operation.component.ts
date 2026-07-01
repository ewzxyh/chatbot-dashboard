import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { formatChatcaseDate, formatChatcaseDateTime } from '../../utils/chatcase-locale';

@Component({
  selector: 'app-admin-operation',
  templateUrl: './admin-operation.component.html',
  styleUrls: ['./admin-operation.component.scss']
})
export class AdminOperationComponent implements OnInit {
  summary: any = null;
  metrics: any = null;
  metricRows: any[] = [];
  eventMetricItems: any[] = [];
  alertMetricItems: any[] = [];
  statusCards: any[] = [];
  affectedItems: any[] = [];
  queueRows: any[] = [];
  events: any[] = [];
  affectedColumns = ['type', 'name', 'status', 'detail', 'lastAt'];
  alertColumns = ['severity', 'alert', 'occurrences', 'channel', 'lastAt'];
  queueColumns = ['name', 'status', 'ready', 'unacknowledged', 'total', 'consumers', 'source'];
  metricColumns = ['period', 'events', 'errors', 'failed', 'alerts', 'critical', 'open'];
  channelColumns = ['status', 'channel', 'name', 'provider', 'project', 'lastWebhook', 'lastError', 'actions'];
  eventColumns = ['timestamp', 'level', 'channel', 'event', 'project', 'error'];
  isLoading = true;
  isLoadingMetrics = false;
  isLoadingEvents = false;
  isTestingStorage = false;
  isTestingNotification = false;
  testingChannelKey = '';
  registeringWebhookKey = '';
  channelTestResults: any = {};
  webhookRegisterResults: any = {};
  notificationTestResult: any = null;
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
    project_id: '',
    integrationId: ''
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
        this.applySummary(data);
        this.isLoading = false;
      },
      () => {
        this.errorMessage = 'Erro ao carregar status operacional';
        this.isLoading = false;
      }
    );
  }

  applySummary(data: any) {
    this.summary = data;
    this.rebuildStatusPage();
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
        this.eventMetricItems = this.buildTopMetricItems(result, 'events', 'byEvent');
        this.alertMetricItems = this.buildTopMetricItems(result, 'alerts', 'byType');
        this.isLoadingMetrics = false;
      },
      () => {
        this.metrics = null;
        this.metricRows = [];
        this.eventMetricItems = [];
        this.alertMetricItems = [];
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

  registerWebhook(channel: any) {
    if (!channel) return;
    const integrationId = channel.integrationDocId || channel.integrationId;
    const key = this.channelKey(channel);
    this.registeringWebhookKey = key;
    this.webhookRegisterResults[key] = null;

    this.adminService.registerChannelWebhook(channel.channel, integrationId).subscribe(
      (response) => {
        const result = response && response.result ? response.result : response;
        this.webhookRegisterResults[key] = result;
        this.registeringWebhookKey = '';
        channel.lastWebhookRegistrationAt = result.providerCheckedAt || new Date().toISOString();
        channel.lastWebhookRegistrationStatus = result.status;
        this.loadEvents();
        this.loadMetrics();
      },
      () => {
        this.webhookRegisterResults[key] = {
          status: 'failed',
          providerReason: 'webhook_register_failed'
        };
        this.registeringWebhookKey = '';
      }
    );
  }

  showChannelErrors(channel: any) {
    if (!channel) return;
    this.eventFilters.channel = channel.channel || '';
    this.eventFilters.level = 'error';
    this.eventFilters.project_id = channel.id_project || '';
    this.eventFilters.integrationId = channel.integrationDocId || channel.integrationId || '';
    this.loadEvents();
  }

  clearEventFilters() {
    this.eventFilters = {
      channel: '',
      level: '',
      project_id: '',
      integrationId: ''
    };
    this.loadEvents();
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

  testAlertNotification() {
    if (this.isTestingNotification) return;
    this.isTestingNotification = true;
    this.notificationTestResult = null;

    this.adminService.testOperationalAlertNotification().subscribe(
      (response) => {
        this.notificationTestResult = response && response.result ? response.result : response;
        this.isTestingNotification = false;
        this.loadEvents();
        this.loadMetrics();
      },
      () => {
        this.notificationTestResult = {
          status: 'failed',
          ok: false,
          error: 'test_failed'
        };
        this.isTestingNotification = false;
      }
    );
  }

  mergeStorageResult(result: any) {
    if (!this.summary || !this.summary.services || !result) return;
    const index = this.summary.services.findIndex((service) => service.name === 'storage');
    if (index === -1) {
      this.summary.services.push(result);
      this.rebuildStatusPage();
      return;
    }
    this.summary.services[index] = Object.assign({}, this.summary.services[index], result);
    this.rebuildStatusPage();
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
    this.rebuildStatusPage();
  }

  rebuildStatusPage() {
    if (!this.summary) {
      this.statusCards = [];
      this.affectedItems = [];
      this.queueRows = [];
      return;
    }

    const services = Array.isArray(this.summary.services) ? this.summary.services : [];
    const channels = Array.isArray(this.summary.channels) ? this.summary.channels : [];
    const alerts = Array.isArray(this.summary.alerts) ? this.summary.alerts : [];
    const queues = this.extractQueueRows();
    const serviceIssues = services.filter((service) => this.isIssueStatus(service.status));
    const channelIssues = channels.filter((channel) => {
      return this.isIssueStatus(channel.status) ||
        this.isIssueStatus(channel.providerHealth) ||
        this.isIssueStatus(channel.providerStatus);
    });
    const queueIssues = queues.filter((queue) => this.isQueueIssue(queue));
    const criticalAlerts = alerts.filter((alert) => String(alert.severity || '').toLowerCase() === 'critical');

    this.queueRows = queues;
    this.statusCards = [
      {
        label: 'Status geral',
        value: this.getStatusLabel(this.summary.overallStatus),
        status: this.summary.overallStatus,
        detail: this.formatDate(this.summary.generatedAt)
      },
      {
        label: 'Alertas críticos',
        value: criticalAlerts.length,
        status: criticalAlerts.length > 0 ? 'down' : 'ok',
        detail: alerts.length + ' alertas abertos'
      },
      {
        label: 'Serviços afetados',
        value: serviceIssues.length,
        status: this.getCollectionStatus(serviceIssues),
        detail: services.length + ' monitorados'
      },
      {
        label: 'Canais afetados',
        value: channelIssues.length,
        status: this.getCollectionStatus(channelIssues),
        detail: channels.length + ' conectores'
      },
      {
        label: 'Filas com risco',
        value: queueIssues.length,
        status: this.getCollectionStatus(queueIssues),
        detail: queues.length + ' monitoradas'
      }
    ];

    this.affectedItems = this.buildAffectedItems(alerts, serviceIssues, channelIssues, queueIssues);
  }

  extractQueueRows(): any[] {
    if (!this.summary || !this.summary.queues || !this.summary.queues.details) return [];
    const queues = this.summary.queues.details.queues;
    return Array.isArray(queues) ? queues : [];
  }

  buildAffectedItems(alerts: any[], services: any[], channels: any[], queues: any[]): any[] {
    const items = [];

    alerts.forEach((alert) => {
      items.push({
        type: 'Alerta',
        name: alert.title || alert.key || alert.type,
        status: alert.severity || 'warning',
        detail: alert.message || alert.type || '',
        lastAt: alert.lastAt
      });
    });

    services.forEach((service) => {
      items.push({
        type: 'Serviço',
        name: service.label || service.name,
        status: service.status,
        detail: this.serviceDetail(service),
        lastAt: this.summary.generatedAt
      });
    });

    channels.forEach((channel) => {
      items.push({
        type: 'Canal',
        name: (channel.name || channel.integrationId || channel.channel) + ' (' + channel.channel + ')',
        status: channel.providerHealth || channel.status || channel.providerStatus,
        detail: channel.providerReason || channel.lastError || this.providerDetail(channel),
        lastAt: channel.providerCheckedAt || channel.lastErrorAt || channel.lastWebhookAt
      });
    });

    queues.forEach((queue) => {
      items.push({
        type: 'Fila',
        name: queue.name,
        status: queue.status,
        detail: this.queueDetail(queue),
        lastAt: this.summary.generatedAt
      });
    });

    return items.slice(0, 12);
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      ok: 'OK',
      degraded: 'Degradado',
      down: 'Indisponível',
      unknown: 'Sem configuração',
      skipped: 'Ignorado',
      failed: 'Falhou',
      warning: 'Aviso',
      critical: 'Crítico',
      success: 'Sucesso',
      registered: 'Registrado',
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
    if (normalized === 'degraded' || normalized === 'warn' || normalized === 'warning' || normalized === 'skipped' || normalized === 'restricted' || normalized === 'flagged' || normalized === 'rate_limited' || normalized === 'capped' || normalized === 'yellow') return 'status-warn';
    if (normalized === 'down' || normalized === 'error' || normalized === 'failed' || normalized === 'critical' || normalized === 'disconnected' || normalized === 'banned' || normalized === 'bannedm' || normalized === 'disabled' || normalized === 'red') return 'status-error';
    return 'status-unknown';
  }

  isIssueStatus(status: string): boolean {
    const normalized = status ? String(status).toLowerCase() : '';
    return [
      'degraded',
      'warn',
      'warning',
      'restricted',
      'flagged',
      'rate_limited',
      'capped',
      'yellow',
      'down',
      'error',
      'failed',
      'disconnected',
      'banned',
      'bannedm',
      'disabled',
      'red'
    ].indexOf(normalized) !== -1;
  }

  isErrorStatus(status: string): boolean {
    const normalized = status ? String(status).toLowerCase() : '';
    return [
      'down',
      'error',
      'failed',
      'disconnected',
      'banned',
      'bannedm',
      'disabled',
      'red'
    ].indexOf(normalized) !== -1;
  }

  getCollectionStatus(items: any[]): string {
    if (!items || items.length === 0) return 'ok';
    const hasError = items.some((item) => this.isErrorStatus(item.status || item.providerHealth || item.providerStatus));
    return hasError ? 'down' : 'degraded';
  }

  isQueueIssue(queue: any): boolean {
    if (!queue) return false;
    return this.isIssueStatus(queue.status) ||
      Number(queue.messagesReady || 0) > 0 ||
      Number(queue.messagesUnacknowledged || 0) > 0 ||
      Number(queue.consumers || 0) === 0;
  }

  formatDate(value: string): string {
    if (!value) return 'N/A';
    return formatChatcaseDateTime(value);
  }

  formatBucket(value: string): string {
    if (!value) return 'N/A';
    if (this.metricFilters.bucket === 'day') {
      return formatChatcaseDate(value);
    }
    return formatChatcaseDateTime(value);
  }

  metricCount(group: string, collection: string, key: string): number {
    if (!this.metrics || !this.metrics[group] || !this.metrics[group][collection]) return 0;
    return this.metrics[group][collection][key] || 0;
  }

  topMetricItems(group: string, collection: string): any[] {
    return this.buildTopMetricItems(this.metrics, group, collection);
  }

  buildTopMetricItems(metrics: any, group: string, collection: string): any[] {
    if (!metrics || !metrics[group] || !metrics[group][collection]) return [];
    return Object.keys(metrics[group][collection])
      .map((key) => ({ key, count: metrics[group][collection][key] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  serviceDetail(service: any): string {
    if (!service || !service.details) return '';
    if (service.details.reason) return service.details.reason;
    if (service.details.error) return service.details.error;
    if (service.name === 'server') return 'ativo há ' + service.details.uptimeSeconds + 's';
    if (service.latencyMs !== null && service.latencyMs !== undefined) return service.latencyMs + ' ms';
    return '';
  }

  queueDetail(queue: any): string {
    if (!queue) return '';
    return 'prontas ' + Number(queue.messagesReady || 0) +
      ' | não confirmadas ' + Number(queue.messagesUnacknowledged || 0) +
      ' | consumidores ' + Number(queue.consumers || 0);
  }

  providerDetail(channel: any): string {
    if (!channel) return '';
    const parts = [];
    if (channel.providerStatus) parts.push('provedor: ' + channel.providerStatus);
    if (channel.qualityRating) parts.push('qualidade: ' + channel.qualityRating);
    if (channel.nameStatus) parts.push('nome: ' + channel.nameStatus);
    if (channel.canSendNewMessages === false) parts.push('envio limitado');
    if (channel.providerLatencyMs !== null && channel.providerLatencyMs !== undefined) parts.push(channel.providerLatencyMs + ' ms');
    return parts.join(' | ');
  }

  notificationResultDetail(result: any): string {
    if (!result) return '';
    const parts = [];
    if (result.webhook && result.webhook.status) parts.push('webhook: ' + result.webhook.status);
    if (result.email && result.email.status) parts.push('email: ' + result.email.status);
    if (result.error) parts.push(result.error);
    return parts.join(' | ');
  }
}
