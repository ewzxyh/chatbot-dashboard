import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-operation',
  templateUrl: './admin-operation.component.html',
  styleUrls: ['./admin-operation.component.scss']
})
export class AdminOperationComponent implements OnInit {
  summary: any = null;
  events: any[] = [];
  isLoading = true;
  isLoadingEvents = false;
  testingChannelKey = '';
  channelTestResults: any = {};
  errorMessage = '';
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
