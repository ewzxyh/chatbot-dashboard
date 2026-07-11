import { Component } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { formatChatcaseDate, formatChatcaseDateTime } from '../../utils/chatcase-locale';
import { AdminService } from '../../services/admin.service';
import {
  OPERATIONAL_ALERT_STATUSES,
  OPERATIONAL_CAUSE_CODES,
  OPERATIONAL_CHANNELS,
  OPERATIONAL_PRODUCTS,
  OPERATIONAL_STATUSES
} from '../../services/admin.service';
import type {
  AlertStatus,
  ChannelDiagnostic,
  ChannelDiagnosticFilters,
  HealthSummaryV2,
  OperationalAlert,
  OperationalAlertFilters,
  OperationalCauseCode,
  OperationalChannel,
  OperationalProduct,
  OperationalSnapshotItem,
  OperationalStatus,
  PagedResponse
} from '../../services/admin.service';
import { isOperationalIssueStatus, isOperationalQueueIssue } from '../admin-operational-status.util';

type OperationTab = 'channels' | 'alerts' | 'diagnostics' | 'events';
type OperationResourceType = 'service' | 'queue';
type SupportedWebhookProduct = 'casezap' | 'waba';

interface OperationTabDefinition {
  id: OperationTab;
  label: string;
}

export interface OperationFilters {
  page: number;
  limit: number;
  product?: OperationalProduct | '';
  channel?: string;
  status?: OperationalStatus | AlertStatus | '';
  cause?: OperationalCauseCode;
  from?: string;
  to?: string;
}

interface OperationFilterInput {
  page?: unknown;
  limit?: unknown;
  product?: unknown;
  channel?: unknown;
  status?: unknown;
  cause?: unknown;
  from?: unknown;
  to?: unknown;
}

interface OperationState {
  tab: OperationTab;
  filters: OperationFilters;
  resource: string;
  resourceType?: OperationResourceType;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z$/;

@Component({
  selector: 'app-admin-operation',
  templateUrl: './admin-operation.component.html',
  styleUrls: ['./admin-operation.component.scss']
})
export class AdminOperationComponent implements OnInit, OnDestroy {
  readonly operationTabs: OperationTabDefinition[] = [
    { id: 'channels', label: 'Canais' },
    { id: 'alerts', label: 'Alertas' },
    { id: 'diagnostics', label: 'Diagnostico / Infraestrutura' },
    { id: 'events', label: 'Eventos / Metricas' }
  ];
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly products = OPERATIONAL_PRODUCTS;
  readonly channelStatuses = OPERATIONAL_STATUSES;
  readonly alertStatuses = OPERATIONAL_ALERT_STATUSES;
  readonly channelColumns = ['status', 'product', 'channel', 'name', 'project', 'cause', 'checkedAt', 'actions'];
  readonly alertColumns = ['severity', 'status', 'alert', 'resource', 'channel', 'project', 'occurrences', 'lastAt'];
  readonly diagnosticColumns = ['name', 'status', 'cause', 'checkedAt'];
  readonly eventColumns = ['timestamp', 'level', 'channel', 'event', 'project', 'error'];
  readonly metricColumns = ['period', 'events', 'errors', 'failed', 'alerts', 'critical', 'open'];

  tab: OperationTab = 'channels';
  filters: OperationFilters = { page: DEFAULT_PAGE, limit: DEFAULT_LIMIT };
  channelRows: ChannelDiagnostic[] = [];
  alertRows: OperationalAlert[] = [];
  count = 0;
  isLoading = false;
  errorMessage = '';
  hasLoaded = false;
  summary: HealthSummaryV2 = null;
  isSummaryLoading = false;
  summaryErrorMessage = '';
  metrics: any = null;
  metricRows: any[] = [];
  eventMetricItems: any[] = [];
  alertMetricItems: any[] = [];
  events: any[] = [];
  isLoadingMetrics = false;
  isLoadingEvents = false;
  metricsErrorMessage = '';
  eventsErrorMessage = '';
  isTestingStorage = false;
  isTestingNotification = false;
  channelTestResults: Record<string, any> = {};
  webhookRegisterResults: Record<string, any> = {};
  notificationTestResult: any = null;
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

  private resource = '';
  private resourceType: OperationResourceType | undefined;
  private routeSubscription: Subscription = null;
  private detailsSubscription: Subscription = null;
  private summarySubscription: Subscription = null;
  private eventsSubscription: Subscription = null;
  private metricsSubscription: Subscription = null;
  private actionSubscriptions = new Subscription();
  private detailsRequestId = 0;
  private summaryRequestId = 0;
  private eventsRequestId = 0;
  private metricsRequestId = 0;
  private testingChannelKeys = new Set<string>();
  private registeringWebhookKeys = new Set<string>();
  private destroyed = false;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.destroyed = false;
    this.loadSummary();
    this.routeSubscription = this.route.queryParams.subscribe((params) => this.applyQueryParams(params));
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.detailsRequestId++;
    this.summaryRequestId++;
    this.eventsRequestId++;
    this.metricsRequestId++;
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
    if (this.detailsSubscription) this.detailsSubscription.unsubscribe();
    if (this.summarySubscription) this.summarySubscription.unsubscribe();
    if (this.eventsSubscription) this.eventsSubscription.unsubscribe();
    if (this.metricsSubscription) this.metricsSubscription.unsubscribe();
    this.actionSubscriptions.unsubscribe();
  }

  refresh(): void {
    this.loadSummary();
    this.load();
  }

  loadSummary(): void {
    if (this.destroyed) return;
    const requestId = ++this.summaryRequestId;
    if (this.summarySubscription) this.summarySubscription.unsubscribe();
    this.isSummaryLoading = true;
    this.summaryErrorMessage = '';
    this.summarySubscription = this.adminService.getOperationalHealthSummary().subscribe(
      (summary) => {
        if (!this.isCurrentSummaryRequest(requestId)) return;
        this.summary = summary;
        this.isSummaryLoading = false;
      },
      () => {
        if (!this.isCurrentSummaryRequest(requestId)) return;
        this.summaryErrorMessage = 'Erro ao carregar o resumo operacional.';
        this.isSummaryLoading = false;
      }
    );
  }

  retrySummary(): void {
    this.loadSummary();
  }

  load(): void {
    if (this.destroyed) return;
    this.applyState(this.sanitizeState(this.tab, this.filters, this.resource, this.resourceType));
    const requestId = ++this.detailsRequestId;
    const requestTab = this.tab;
    if (this.detailsSubscription) this.detailsSubscription.unsubscribe();
    if (requestTab !== 'events') this.cancelLegacyDataRequests();
    this.hasLoaded = true;
    this.errorMessage = '';
    this.count = 0;
    this.channelRows = [];
    this.alertRows = [];

    if (requestTab === 'diagnostics') {
      this.isLoading = false;
      return;
    }

    if (requestTab === 'events') {
      this.isLoading = false;
      this.loadEvents();
      this.loadMetrics();
      return;
    }

    this.isLoading = true;

    if (requestTab === 'channels') {
      this.detailsSubscription = this.adminService.getOperationalChannels(this.buildChannelRequestFilters()).subscribe(
        (result) => this.applyChannelResponse(requestId, result),
        () => this.applyDetailsError(requestId)
      );
      return;
    }

    this.detailsSubscription = this.adminService.getOperationalAlerts(this.buildAlertRequestFilters()).subscribe(
      (result) => this.applyAlertResponse(requestId, result),
      () => this.applyDetailsError(requestId)
    );
  }

  retry(): void {
    this.load();
  }

  applyFilters(): void {
    this.applyState(this.sanitizeState(
      this.tab,
      { ...this.filters, page: DEFAULT_PAGE },
      this.resource,
      this.resourceType
    ));
    this.syncUrl();
    this.load();
  }

  clearFilters(): void {
    this.applyState(this.sanitizeState(this.tab, {
      page: DEFAULT_PAGE,
      limit: this.filters.limit
    }));
    this.syncUrl();
    this.load();
  }

  changePage(page: number, limit = this.filters.limit): void {
    this.applyState(this.sanitizeState(
      this.tab,
      { ...this.filters, page, limit },
      this.resource,
      this.resourceType
    ));
    this.syncUrl();
    this.load();
  }

  selectTab(tab: OperationTab): void {
    if (this.tab === tab) return;
    this.applyState(this.sanitizeState(
      tab,
      { ...this.filters, page: DEFAULT_PAGE },
      this.resource,
      this.resourceType
    ));
    this.syncUrl();
    this.load();
  }

  selectTabByIndex(index: number): void {
    const selected = this.operationTabs[index];
    if (selected) this.selectTab(selected.id);
  }

  get selectedTabIndex(): number {
    const index = this.operationTabs.findIndex((item) => item.id === this.tab);
    return index === -1 ? 0 : index;
  }

  get isSnapshotMissing(): boolean {
    return this.summary?.snapshotState === 'missing';
  }

  get isSnapshotStale(): boolean {
    return this.summary?.snapshotState === 'stale';
  }

  get isDetailsEmpty(): boolean {
    return this.isPaginatedTab && this.hasLoaded && !this.isLoading && !this.errorMessage && this.currentRows.length === 0;
  }

  get isEmpty(): boolean {
    return this.isDetailsEmpty && !this.isSnapshotMissing;
  }

  get currentRows(): ChannelDiagnostic[] | OperationalAlert[] {
    if (this.tab === 'channels') return this.channelRows;
    if (this.tab === 'alerts') return this.alertRows;
    return [];
  }

  get isPaginatedTab(): boolean {
    return this.tab === 'channels' || this.tab === 'alerts';
  }

  get diagnosticServices(): OperationalSnapshotItem[] {
    return this.summary && Array.isArray(this.summary.services) ? this.summary.services : [];
  }

  get diagnosticQueues(): OperationalSnapshotItem[] {
    return this.summary && Array.isArray(this.summary.queues) ? this.summary.queues : [];
  }

  get diagnosticIssueCount(): number {
    return this.diagnosticServices.filter((service) => isOperationalIssueStatus(service.status)).length +
      this.diagnosticQueues.filter((queue) => this.isQueueIssue(queue)).length;
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.filters.product || this.filters.channel || this.filters.status || this.filters.cause ||
      this.filters.from || this.filters.to || this.resource
    );
  }

  get resourceLabel(): string {
    if (!this.resource) return '';
    return this.resourceType === 'queue' ? 'Fila' : 'Servico';
  }

  get resourceValue(): string {
    return this.resource;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ok: 'Normal',
      degraded: 'Atencao',
      down: 'Indisponivel',
      unknown: 'Sem diagnostico',
      open: 'Aberto',
      resolved: 'Resolvido',
      info: 'Informacao',
      warning: 'Aviso',
      critical: 'Critico'
    };
    return labels[status] || status || 'N/A';
  }

  getStatusClass(status: string): string {
    if (status === 'ok' || status === 'resolved' || status === 'info') return 'status-ok';
    if (status === 'degraded' || status === 'warning') return 'status-warn';
    if (status === 'down' || status === 'open' || status === 'critical') return 'status-error';
    return 'status-unknown';
  }

  formatDate(value: string | null): string {
    return value ? formatChatcaseDateTime(value) : 'N/A';
  }

  formatBucket(value: string): string {
    if (!value) return 'N/A';
    return this.metricFilters.bucket === 'day' ? formatChatcaseDate(value) : formatChatcaseDateTime(value);
  }

  channelKey(channel: ChannelDiagnostic): string {
    return channel ? `${channel.channel}:${channel.integrationId || ''}` : '';
  }

  isTestingChannel(key: string): boolean {
    return this.testingChannelKeys.has(key);
  }

  isRegisteringWebhook(key: string): boolean {
    return this.registeringWebhookKeys.has(key);
  }

  canRegisterWebhook(channel: ChannelDiagnostic): boolean {
    return this.getWebhookProduct(channel) !== null;
  }

  testChannel(channel: ChannelDiagnostic): void {
    if (!channel || this.destroyed) return;
    const key = this.channelKey(channel);
    if (this.isTestingChannel(key)) return;
    this.testingChannelKeys.add(key);
    this.channelTestResults[key] = null;
    const subscription = this.adminService.testChannelConnection(channel.channel, channel.integrationId).subscribe(
      (response) => {
        const result = response && response.result ? response.result : response;
        this.channelTestResults[key] = result;
        this.testingChannelKeys.delete(key);
        const status = result && (result.providerHealth || result.status);
        if (OPERATIONAL_STATUSES.includes(status as OperationalStatus)) channel.status = status as OperationalStatus;
        this.loadEvents();
      },
      () => {
        this.channelTestResults[key] = { providerHealth: 'down', providerReason: 'test_failed' };
        this.testingChannelKeys.delete(key);
      }
    );
    this.actionSubscriptions.add(subscription);
  }

  registerWebhook(channel: ChannelDiagnostic): void {
    const product = this.getWebhookProduct(channel);
    if (!channel || this.destroyed || !product) return;
    const key = this.channelKey(channel);
    if (this.isRegisteringWebhook(key)) return;
    this.registeringWebhookKeys.add(key);
    this.webhookRegisterResults[key] = null;
    const subscription = this.adminService.registerChannelWebhook(product, channel.integrationId).subscribe(
      (response) => {
        this.webhookRegisterResults[key] = response && response.result ? response.result : response;
        this.registeringWebhookKeys.delete(key);
        this.loadEvents();
        this.loadMetrics();
      },
      () => {
        this.webhookRegisterResults[key] = { status: 'failed', providerReason: 'webhook_register_failed' };
        this.registeringWebhookKeys.delete(key);
      }
    );
    this.actionSubscriptions.add(subscription);
  }

  showChannelErrors(channel: ChannelDiagnostic): void {
    if (!channel) return;
    this.eventFilters = {
      channel: channel.channel || '',
      level: 'error',
      project_id: channel.id_project || '',
      integrationId: channel.integrationId || ''
    };
    this.selectTab('events');
  }

  clearEventFilters(): void {
    this.eventFilters = {
      channel: '',
      level: '',
      project_id: '',
      integrationId: ''
    };
    this.loadEvents();
  }

  private getWebhookProduct(channel: ChannelDiagnostic): SupportedWebhookProduct | null {
    const product = this.normalizeString(channel ? channel.product : null).toLowerCase();
    return product === 'casezap' || product === 'waba' ? product : null;
  }

  testStorage(): void {
    if (this.isTestingStorage || this.destroyed) return;
    this.isTestingStorage = true;
    const subscription = this.adminService.testStorageConnection().subscribe(
      (response) => {
        this.mergeStorageResult(response && response.result ? response.result : response);
        this.isTestingStorage = false;
        this.loadSummary();
        this.loadEvents();
        this.loadMetrics();
      },
      () => {
        this.mergeStorageResult({ name: 'storage', status: 'down', cause: 'storage_unavailable' });
        this.isTestingStorage = false;
      }
    );
    this.actionSubscriptions.add(subscription);
  }

  testAlertNotification(): void {
    if (this.isTestingNotification || this.destroyed) return;
    this.isTestingNotification = true;
    this.notificationTestResult = null;
    const subscription = this.adminService.testOperationalAlertNotification().subscribe(
      (response) => {
        this.notificationTestResult = response && response.result ? response.result : response;
        this.isTestingNotification = false;
        this.loadEvents();
        this.loadMetrics();
      },
      () => {
        this.notificationTestResult = { status: 'failed', ok: false, error: 'test_failed' };
        this.isTestingNotification = false;
      }
    );
    this.actionSubscriptions.add(subscription);
  }

  loadEvents(): void {
    if (this.destroyed) return;
    const requestId = ++this.eventsRequestId;
    if (this.eventsSubscription) this.eventsSubscription.unsubscribe();
    this.isLoadingEvents = true;
    this.eventsErrorMessage = '';
    this.eventsSubscription = this.adminService.getOperationalEvents(this.eventFilters).subscribe(
      (result) => {
        if (!this.isCurrentEventsRequest(requestId)) return;
        this.events = result && Array.isArray(result.data) ? result.data : [];
        this.isLoadingEvents = false;
      },
      () => {
        if (!this.isCurrentEventsRequest(requestId)) return;
        this.events = [];
        this.eventsErrorMessage = 'Erro ao carregar eventos operacionais.';
        this.isLoadingEvents = false;
      }
    );
  }

  retryEvents(): void {
    this.loadEvents();
  }

  loadMetrics(): void {
    if (this.destroyed) return;
    const requestId = ++this.metricsRequestId;
    if (this.metricsSubscription) this.metricsSubscription.unsubscribe();
    this.isLoadingMetrics = true;
    this.metricsErrorMessage = '';
    this.metricsSubscription = this.adminService.getOperationalMetrics(this.metricFilters).subscribe(
      (result) => {
        if (!this.isCurrentMetricsRequest(requestId)) return;
        this.metrics = result;
        this.metricRows = this.mergeMetricRows(result);
        this.eventMetricItems = this.buildTopMetricItems(result, 'events', 'byEvent');
        this.alertMetricItems = this.buildTopMetricItems(result, 'alerts', 'byType');
        this.isLoadingMetrics = false;
      },
      () => {
        if (!this.isCurrentMetricsRequest(requestId)) return;
        this.metrics = null;
        this.metricRows = [];
        this.eventMetricItems = [];
        this.alertMetricItems = [];
        this.metricsErrorMessage = 'Erro ao carregar metricas operacionais.';
        this.isLoadingMetrics = false;
      }
    );
  }

  retryMetrics(): void {
    this.loadMetrics();
  }

  onMetricRangeChange(): void {
    if (this.metricFilters.range === '24h') {
      this.metricFilters.bucket = 'hour';
    } else if (!this.metricFilters.bucket) {
      this.metricFilters.bucket = 'day';
    }
    this.loadMetrics();
  }

  metricCount(group: string, collection: string, key: string): number {
    if (!this.metrics || !this.metrics[group] || !this.metrics[group][collection]) return 0;
    return this.metrics[group][collection][key] || 0;
  }

  notificationResultDetail(result: any): string {
    if (!result) return '';
    const parts = [];
    if (result.webhook && result.webhook.status) parts.push(`webhook: ${result.webhook.status}`);
    if (result.email && result.email.status) parts.push(`email: ${result.email.status}`);
    if (result.error) parts.push(result.error);
    return parts.join(' | ');
  }

  isQueueIssue(queue: OperationalSnapshotItem): boolean {
    if (!queue) return false;
    const hasLegacyCounters = 'messagesReady' in queue || 'messagesUnacknowledged' in queue || 'consumers' in queue;
    if (hasLegacyCounters) return isOperationalQueueIssue(queue);
    return isOperationalIssueStatus(queue.status) || Boolean(queue.cause);
  }

  private mergeStorageResult(result: any): void {
    if (!this.summary || !result) return;
    const services = [...this.diagnosticServices];
    const index = services.findIndex((service) => service.name === 'storage');
    const current = index === -1 ? null : services[index];
    const status = OPERATIONAL_STATUSES.includes(result.status as OperationalStatus)
      ? result.status as OperationalStatus
      : current ? current.status : 'unknown';
    const storage: OperationalSnapshotItem = {
      name: result.name || 'storage',
      status,
      cause: result.cause || (current && current.cause) || null,
      checkedAt: result.checkedAt || result.providerCheckedAt || (current && current.checkedAt) || ''
    };
    if (index === -1) services.push(storage);
    else services[index] = storage;
    this.summary = { ...this.summary, services };
  }

  private mergeMetricRows(metrics: any): any[] {
    if (!metrics) return [];
    const alertByBucket: Record<string, any> = {};
    const eventRows = metrics.events && Array.isArray(metrics.events.byBucket) ? metrics.events.byBucket : [];
    const alertRows = metrics.alerts && Array.isArray(metrics.alerts.byBucket) ? metrics.alerts.byBucket : [];
    for (const row of alertRows) alertByBucket[row.bucketStart] = row;
    const rows = eventRows.map((row) => {
      const alertRow = alertByBucket[row.bucketStart] || {};
      return {
        bucketStart: row.bucketStart,
        events: row.count || 0,
        errors: row.errors || 0,
        failed: row.failed || 0,
        alerts: alertRow.count || 0,
        criticalAlerts: alertRow.critical || 0,
        openAlerts: alertRow.open || 0
      };
    });
    for (const row of alertRows) {
      if (rows.some((eventRow) => eventRow.bucketStart === row.bucketStart)) continue;
      rows.push({
        bucketStart: row.bucketStart,
        events: 0,
        errors: 0,
        failed: 0,
        alerts: row.count || 0,
        criticalAlerts: row.critical || 0,
        openAlerts: row.open || 0
      });
    }
    return rows.sort((left, right) => {
      return new Date(right.bucketStart).getTime() - new Date(left.bucketStart).getTime();
    }).slice(0, 10);
  }

  private buildTopMetricItems(metrics: any, group: string, collection: string): any[] {
    if (!metrics || !metrics[group] || !metrics[group][collection]) return [];
    return Object.keys(metrics[group][collection])
      .map((key) => ({ key, count: metrics[group][collection][key] }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }

  private applyChannelResponse(requestId: number, result: PagedResponse<ChannelDiagnostic>): void {
    if (!this.isCurrentDetailsRequest(requestId)) return;
    this.applyPageMetadata(result);
    this.channelRows = result && Array.isArray(result.data) ? result.data : [];
    this.alertRows = [];
    this.isLoading = false;
  }

  private applyAlertResponse(requestId: number, result: PagedResponse<OperationalAlert>): void {
    if (!this.isCurrentDetailsRequest(requestId)) return;
    this.applyPageMetadata(result);
    this.alertRows = result && Array.isArray(result.data) ? result.data : [];
    this.channelRows = [];
    this.isLoading = false;
  }

  private applyPageMetadata(result: PagedResponse<unknown>): void {
    this.count = result && Number.isFinite(result.count) ? result.count : 0;
    this.filters = {
      ...this.filters,
      page: this.validInteger(result && result.page, Number.MAX_SAFE_INTEGER) ? result.page : this.filters.page,
      limit: this.validInteger(result && result.limit, MAX_LIMIT) ? result.limit : this.filters.limit
    };
  }

  private applyDetailsError(requestId: number): void {
    if (!this.isCurrentDetailsRequest(requestId)) return;
    this.channelRows = [];
    this.alertRows = [];
    this.count = 0;
    this.errorMessage = 'Erro ao carregar a operacao.';
    this.isLoading = false;
  }

  private applyQueryParams(params: Params): void {
    const parsed = this.parseQueryParams(params);
    const changed = !this.sameState(parsed);
    this.applyState(parsed);

    const canonical = this.buildQueryParams();
    if (!this.queryParamsEqual(params, canonical)) this.navigate(canonical);
    if (changed || !this.hasLoaded) this.load();
  }

  private parseQueryParams(params: Params): OperationState {
    const tabValue = this.normalizeString(this.queryValue(params, 'tab'));
    const tab = this.operationTabs.some((item) => item.id === tabValue)
      ? tabValue as OperationTab
      : 'channels';
    return this.sanitizeState(tab, {
      page: this.queryValue(params, 'page'),
      limit: this.queryValue(params, 'limit'),
      product: this.queryValue(params, 'product'),
      channel: this.queryValue(params, 'channel'),
      status: this.queryValue(params, 'status'),
      cause: this.queryValue(params, 'cause'),
      from: this.queryValue(params, 'from'),
      to: this.queryValue(params, 'to')
    }, this.queryValue(params, 'resource'), this.queryValue(params, 'resourceType'));
  }

  private sanitizeState(
    tab: OperationTab,
    input: OperationFilterInput,
    resourceInput?: unknown,
    resourceTypeInput?: unknown
  ): OperationState {
    if (tab === 'diagnostics' || tab === 'events') {
      return {
        tab,
        filters: { page: DEFAULT_PAGE, limit: DEFAULT_LIMIT },
        resource: '',
        resourceType: undefined
      };
    }

    const filters: OperationFilters = {
      page: this.parseInteger(input.page, DEFAULT_PAGE, Number.MAX_SAFE_INTEGER),
      limit: this.parseInteger(input.limit, DEFAULT_LIMIT, MAX_LIMIT),
      product: '',
      status: ''
    };
    const product = this.normalizeString(input.product);
    const channel = this.normalizeString(input.channel);
    const status = this.normalizeString(input.status);
    const cause = this.normalizeString(input.cause);
    const from = this.normalizeString(input.from);
    const to = this.normalizeString(input.to);

    if (OPERATIONAL_PRODUCTS.includes(product as OperationalProduct)) filters.product = product as OperationalProduct;
    if (channel && (tab === 'alerts' || OPERATIONAL_CHANNELS.includes(channel as OperationalChannel))) {
      filters.channel = channel;
    }
    if (tab === 'channels' && OPERATIONAL_STATUSES.includes(status as OperationalStatus)) {
      filters.status = status as OperationalStatus;
    }
    if (tab === 'alerts' && OPERATIONAL_ALERT_STATUSES.includes(status as AlertStatus)) {
      filters.status = status as AlertStatus;
    }
    if (OPERATIONAL_CAUSE_CODES.includes(cause as OperationalCauseCode)) filters.cause = cause as OperationalCauseCode;
    if (this.isValidOperationalDate(from)) filters.from = from;
    if (this.isValidOperationalDate(to)) filters.to = to;
    if (filters.from && filters.to && this.toTimestamp(filters.from, false) > this.toTimestamp(filters.to, true)) {
      delete filters.from;
      delete filters.to;
    }

    const resource = this.normalizeString(resourceInput);
    const resourceType = this.normalizeString(resourceTypeInput);
    const validResourceType = resourceType === 'service' || resourceType === 'queue'
      ? resourceType as OperationResourceType
      : undefined;
    const keepResource = tab === 'alerts' && resource && validResourceType;

    return {
      tab,
      filters,
      resource: keepResource ? resource : '',
      resourceType: keepResource ? validResourceType : undefined
    };
  }

  private buildChannelRequestFilters(): ChannelDiagnosticFilters {
    const request: ChannelDiagnosticFilters = {
      page: this.filters.page,
      limit: this.filters.limit
    };
    if (this.filters.product && OPERATIONAL_PRODUCTS.includes(this.filters.product)) request.product = this.filters.product;
    if (this.filters.channel && OPERATIONAL_CHANNELS.includes(this.filters.channel as OperationalChannel)) {
      request.channel = this.filters.channel as OperationalChannel;
    }
    if (this.filters.status && OPERATIONAL_STATUSES.includes(this.filters.status as OperationalStatus)) {
      request.status = this.filters.status as OperationalStatus;
    }
    if (this.filters.cause && OPERATIONAL_CAUSE_CODES.includes(this.filters.cause)) request.cause = this.filters.cause;
    if (this.filters.from && this.isValidOperationalDate(this.filters.from)) request.from = this.filters.from;
    if (this.filters.to && this.isValidOperationalDate(this.filters.to)) request.to = this.filters.to;
    return request;
  }

  private buildAlertRequestFilters(): OperationalAlertFilters {
    const request: OperationalAlertFilters = {
      page: this.filters.page,
      limit: this.filters.limit
    };
    if (this.filters.product && OPERATIONAL_PRODUCTS.includes(this.filters.product)) request.product = this.filters.product;
    if (this.filters.channel) request.channel = this.filters.channel;
    if (this.filters.status && OPERATIONAL_ALERT_STATUSES.includes(this.filters.status as AlertStatus)) {
      request.status = this.filters.status as AlertStatus;
    }
    if (this.filters.cause && OPERATIONAL_CAUSE_CODES.includes(this.filters.cause)) request.cause = this.filters.cause;
    if (this.filters.from && this.isValidOperationalDate(this.filters.from)) request.from = this.filters.from;
    if (this.filters.to && this.isValidOperationalDate(this.filters.to)) request.to = this.filters.to;
    if (this.resource && this.resourceType === 'service') request.service = this.resource;
    if (this.resource && this.resourceType === 'queue') request.queue = this.resource;
    return request;
  }

  private syncUrl(): void {
    this.navigate(this.buildQueryParams());
  }

  private navigate(queryParams: Params): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  private buildQueryParams(): Params {
    if (!this.isPaginatedTab) return { tab: this.tab };
    const queryParams: Params = {
      tab: this.tab,
      page: this.filters.page,
      limit: this.filters.limit
    };
    const filterKeys: Array<keyof OperationFilters> = ['product', 'channel', 'status', 'cause', 'from', 'to'];
    for (const key of filterKeys) {
      if (this.filters[key]) queryParams[key] = this.filters[key];
    }
    if (this.tab === 'alerts' && this.resource && this.resourceType) {
      queryParams.resource = this.resource;
      queryParams.resourceType = this.resourceType;
    }
    return queryParams;
  }

  private applyState(state: OperationState): void {
    this.tab = state.tab;
    this.filters = state.filters;
    this.resource = state.resource;
    this.resourceType = state.resourceType;
  }

  private sameState(state: OperationState): boolean {
    return this.tab === state.tab && this.resource === state.resource && this.resourceType === state.resourceType &&
      this.sameFilters(this.filters, state.filters);
  }

  private queryParamsEqual(params: Params, canonical: Params): boolean {
    const actualKeys = Object.keys(params);
    const canonicalKeys = Object.keys(canonical);
    if (actualKeys.length !== canonicalKeys.length) return false;
    return canonicalKeys.every((key) => {
      const value = params[key];
      return !Array.isArray(value) && value !== undefined && value !== null &&
        String(value) === String(canonical[key]);
    });
  }

  private queryValue(params: Params, key: string): string | undefined {
    const value = params[key];
    if (Array.isArray(value)) return value.length === 1 && value[0] !== undefined ? String(value[0]) : undefined;
    return value === undefined || value === null ? undefined : String(value);
  }

  private parseInteger(value: unknown, fallback: number, max: number): number {
    if (typeof value !== 'string' && typeof value !== 'number') return fallback;
    const normalized = String(value);
    if (!/^[1-9]\d*$/.test(normalized)) return fallback;
    const parsed = Number(normalized);
    return this.validInteger(parsed, max) ? parsed : fallback;
  }

  private validInteger(value: number, max: number): boolean {
    return Number.isSafeInteger(value) && value >= 1 && value <= max;
  }

  private normalizeString(value: unknown): string {
    if (typeof value !== 'string') return '';
    const normalized = value.trim();
    return normalized && normalized.length <= 200 ? normalized : '';
  }

  private isValidOperationalDate(value: string): boolean {
    const match = DATE_ONLY.exec(value) || UTC_DATE_TIME.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4] || 0);
    const minute = Number(match[5] || 0);
    const second = Number(match[6] || 0);
    const millisecond = Number(match[7] || 0);
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(hour, minute, second, millisecond);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day && date.getUTCHours() === hour && date.getUTCMinutes() === minute &&
      date.getUTCSeconds() === second && date.getUTCMilliseconds() === millisecond;
  }

  private toTimestamp(value: string, endOfDay: boolean): number {
    if (value.length !== 10) return Date.parse(value);
    return Date.parse(value + (endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'));
  }

  private sameFilters(left: OperationFilters, right: OperationFilters): boolean {
    return left.page === right.page && left.limit === right.limit && left.product === right.product &&
      left.channel === right.channel && left.status === right.status && left.cause === right.cause &&
      left.from === right.from && left.to === right.to;
  }

  private isCurrentDetailsRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.detailsRequestId;
  }

  private isCurrentSummaryRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.summaryRequestId;
  }

  private isCurrentEventsRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.eventsRequestId;
  }

  private isCurrentMetricsRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.metricsRequestId;
  }

  private cancelLegacyDataRequests(): void {
    this.eventsRequestId++;
    this.metricsRequestId++;
    if (this.eventsSubscription) this.eventsSubscription.unsubscribe();
    if (this.metricsSubscription) this.metricsSubscription.unsubscribe();
    this.isLoadingEvents = false;
    this.isLoadingMetrics = false;
  }
}
