import { Component } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { formatChatcaseDateTime } from '../../utils/chatcase-locale';
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
  OperationalStatus,
  PagedResponse
} from '../../services/admin.service';

type OperationTab = 'channels' | 'alerts';
type OperationResourceType = 'service' | 'queue';

export interface OperationFilters {
  page: number;
  limit: number;
  product?: OperationalProduct;
  channel?: string;
  status?: OperationalStatus | AlertStatus;
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
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly products = OPERATIONAL_PRODUCTS;
  readonly channelStatuses = OPERATIONAL_STATUSES;
  readonly alertStatuses = OPERATIONAL_ALERT_STATUSES;
  readonly channelColumns = ['status', 'product', 'channel', 'name', 'project', 'cause', 'checkedAt'];
  readonly alertColumns = ['severity', 'status', 'alert', 'resource', 'channel', 'project', 'occurrences', 'lastAt'];

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

  private resource = '';
  private resourceType: OperationResourceType | undefined;
  private routeSubscription: Subscription = null;
  private detailsSubscription: Subscription = null;
  private summarySubscription: Subscription = null;
  private detailsRequestId = 0;
  private summaryRequestId = 0;
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
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
    if (this.detailsSubscription) this.detailsSubscription.unsubscribe();
    if (this.summarySubscription) this.summarySubscription.unsubscribe();
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
    this.isLoading = true;
    this.errorMessage = '';
    this.hasLoaded = true;
    this.count = 0;
    if (requestTab === 'channels') this.alertRows = [];
    if (requestTab === 'alerts') this.channelRows = [];

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

  changeLimit(limit: number): void {
    this.changePage(DEFAULT_PAGE, limit);
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

  get isSnapshotMissing(): boolean {
    return this.summary?.snapshotState === 'missing';
  }

  get isSnapshotStale(): boolean {
    return this.summary?.snapshotState === 'stale';
  }

  get isDetailsEmpty(): boolean {
    return this.hasLoaded && !this.isLoading && !this.errorMessage && this.currentRows.length === 0;
  }

  get isEmpty(): boolean {
    return this.isDetailsEmpty && !this.isSnapshotMissing;
  }

  get currentRows(): ChannelDiagnostic[] | OperationalAlert[] {
    return this.tab === 'channels' ? this.channelRows : this.alertRows;
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
    const tab = this.normalizeString(this.queryValue(params, 'tab')) === 'alerts' ? 'alerts' : 'channels';
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
    const filters: OperationFilters = {
      page: this.parseInteger(input.page, DEFAULT_PAGE, Number.MAX_SAFE_INTEGER),
      limit: this.parseInteger(input.limit, DEFAULT_LIMIT, MAX_LIMIT)
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
}
