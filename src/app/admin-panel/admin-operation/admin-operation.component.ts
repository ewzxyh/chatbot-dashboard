import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Params } from '@angular/router';
import { Observable } from 'rxjs';
import { formatChatcaseDateTime } from '../../utils/chatcase-locale';
import { AdminService } from '../../services/admin.service';
import type {
  AlertStatus,
  ChannelDiagnostic,
  ChannelDiagnosticFilters,
  OperationalAlert,
  OperationalAlertFilters,
  OperationalCauseCode,
  OperationalProduct,
  OperationalStatus,
  PagedResponse
} from '../../services/admin.service';
import { OPERATIONAL_CAUSE_CODES } from '../../services/admin.service';

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

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;
const CHANNEL_STATUSES: OperationalStatus[] = ['ok', 'degraded', 'down', 'unknown'];
const ALERT_STATUSES: AlertStatus[] = ['open', 'resolved'];
const CHANNEL_FILTERS = ['casezap', 'waba', 'webhook'];
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z$/;

@Component({
  selector: 'app-admin-operation',
  templateUrl: './admin-operation.component.html',
  styleUrls: ['./admin-operation.component.scss']
})
export class AdminOperationComponent implements OnInit {
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly products: OperationalProduct[] = ['casezap', 'waba', 'unknown'];
  readonly channelStatuses = CHANNEL_STATUSES;
  readonly alertStatuses = ALERT_STATUSES;
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

  private resource = '';
  private resourceType: OperationResourceType | undefined;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => this.applyQueryParams(params));
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasLoaded = true;

    const request$: Observable<PagedResponse<ChannelDiagnostic> | PagedResponse<OperationalAlert>> = this.tab === 'channels'
      ? this.adminService.getOperationalChannels(this.buildChannelRequestFilters())
      : this.adminService.getOperationalAlerts(this.buildAlertRequestFilters());

    request$.subscribe(
      (result) => {
        const data = result && Array.isArray(result.data) ? result.data : [];
        this.count = result && Number.isFinite(result.count) ? result.count : 0;
        this.filters = {
          ...this.filters,
          page: this.validPage(result && result.page) ? result.page : this.filters.page,
          limit: this.validLimit(result && result.limit) ? result.limit : this.filters.limit
        };
        if (this.tab === 'channels') {
          this.channelRows = data as ChannelDiagnostic[];
          this.alertRows = [];
        } else {
          this.alertRows = data as OperationalAlert[];
          this.channelRows = [];
        }
        this.isLoading = false;
      },
      () => {
        this.channelRows = [];
        this.alertRows = [];
        this.count = 0;
        this.errorMessage = 'Erro ao carregar a operacao.';
        this.isLoading = false;
      }
    );
  }

  retry(): void {
    this.load();
  }

  applyFilters(): void {
    this.filters.page = DEFAULT_PAGE;
    this.syncUrl();
    this.load();
  }

  clearFilters(): void {
    this.filters = { page: DEFAULT_PAGE, limit: this.filters.limit };
    this.resource = '';
    this.resourceType = undefined;
    this.syncUrl();
    this.load();
  }

  changePage(page: number, limit = this.filters.limit): void {
    if (!this.validPage(page)) return;
    if (!this.validLimit(limit)) return;
    this.filters = { ...this.filters, page, limit };
    this.syncUrl();
    this.load();
  }

  changeLimit(limit: number): void {
    if (!this.validLimit(limit)) return;
    this.filters = { ...this.filters, page: DEFAULT_PAGE, limit };
    this.syncUrl();
    this.load();
  }

  selectTab(tab: OperationTab): void {
    if (this.tab === tab) return;
    this.tab = tab;
    if (!this.isStatusCompatible(this.filters.status, tab)) delete this.filters.status;
    this.filters.page = DEFAULT_PAGE;
    if (tab === 'channels') {
      this.resource = '';
      this.resourceType = undefined;
    }
    this.syncUrl();
    this.load();
  }

  get isEmpty(): boolean {
    return this.hasLoaded && !this.isLoading && !this.errorMessage && this.currentRows.length === 0;
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

  private applyQueryParams(params: Params): void {
    const parsed = this.parseQueryParams(params);
    const changed = this.tab !== parsed.tab || !this.sameFilters(this.filters, parsed.filters) ||
      this.resource !== parsed.resource || this.resourceType !== parsed.resourceType;

    this.tab = parsed.tab;
    this.filters = parsed.filters;
    this.resource = parsed.resource;
    this.resourceType = parsed.resourceType;

    if (changed || !this.hasLoaded) this.load();
  }

  private parseQueryParams(params: Params): {
    tab: OperationTab;
    filters: OperationFilters;
    resource: string;
    resourceType?: OperationResourceType;
  } {
    const tab = this.queryValue(params, 'tab') === 'alerts' ? 'alerts' : 'channels';
    const filters: OperationFilters = {
      page: this.parseInteger(this.queryValue(params, 'page'), DEFAULT_PAGE),
      limit: this.parseInteger(this.queryValue(params, 'limit'), DEFAULT_LIMIT)
    };
    const product = this.queryValue(params, 'product');
    const channel = this.queryValue(params, 'channel');
    const status = this.queryValue(params, 'status');
    const cause = this.queryValue(params, 'cause');
    const from = this.queryValue(params, 'from');
    const to = this.queryValue(params, 'to');

    if (product && this.products.includes(product as OperationalProduct)) filters.product = product as OperationalProduct;
    if (channel && (tab === 'channels' ? CHANNEL_FILTERS.includes(channel) : this.isSafeFilterValue(channel))) {
      filters.channel = channel;
    }
    if (status && this.isStatusCompatible(status, tab)) filters.status = status as OperationalStatus | AlertStatus;
    if (cause && OPERATIONAL_CAUSE_CODES.includes(cause as OperationalCauseCode)) filters.cause = cause as OperationalCauseCode;
    if (from && this.isValidOperationalDate(from)) filters.from = from;
    if (to && this.isValidOperationalDate(to)) filters.to = to;
    if (filters.from && filters.to && this.toTimestamp(filters.from) > this.toTimestamp(filters.to)) {
      delete filters.from;
      delete filters.to;
    }

    const resource = this.queryValue(params, 'resource');
    const resourceType = this.queryValue(params, 'resourceType');
    const validResource = resource && this.isSafeFilterValue(resource) ? resource : '';
    const validResourceType = resourceType === 'service' || resourceType === 'queue' ? resourceType : undefined;

    return {
      tab,
      filters,
      resource: tab === 'alerts' && validResourceType ? validResource : '',
      resourceType: tab === 'alerts' && validResourceType && validResource ? validResourceType : undefined
    };
  }

  private buildChannelRequestFilters(): ChannelDiagnosticFilters {
    return { ...this.filters } as ChannelDiagnosticFilters;
  }

  private buildAlertRequestFilters(): OperationalAlertFilters {
    const filters: OperationalAlertFilters = { ...this.filters } as OperationalAlertFilters;
    if (this.resource && this.resourceType === 'service') filters.service = this.resource;
    if (this.resource && this.resourceType === 'queue') filters.queue = this.resource;
    return filters;
  }

  private syncUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(),
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

  private queryValue(params: Params, key: string): string | undefined {
    const value = params[key];
    if (Array.isArray(value)) return value.length === 1 && value[0] !== undefined ? String(value[0]) : undefined;
    return value === undefined || value === null ? undefined : String(value);
  }

  private parseInteger(value: string | undefined, fallback: number): number {
    if (!value || !/^[1-9]\d*$/.test(value)) return fallback;
    const parsed = Number(value);
    return this.validLimit(parsed) || (fallback === DEFAULT_PAGE && parsed <= Number.MAX_SAFE_INTEGER) ? parsed : fallback;
  }

  private validPage(value: number): boolean {
    return Number.isSafeInteger(value) && value >= DEFAULT_PAGE;
  }

  private validLimit(value: number): boolean {
    return Number.isSafeInteger(value) && value >= 1 && value <= MAX_LIMIT;
  }

  private isStatusCompatible(status: string | undefined, tab: OperationTab): boolean {
    if (!status) return false;
    return tab === 'channels'
      ? CHANNEL_STATUSES.includes(status as OperationalStatus)
      : ALERT_STATUSES.includes(status as AlertStatus);
  }

  private isSafeFilterValue(value: string): boolean {
    return value.trim().length > 0 && value.length <= 200;
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

  private toTimestamp(value: string): number {
    return value.length === 10 ? Date.parse(value + 'T00:00:00.000Z') : Date.parse(value);
  }

  private sameFilters(left: OperationFilters, right: OperationFilters): boolean {
    return left.page === right.page && left.limit === right.limit && left.product === right.product &&
      left.channel === right.channel && left.status === right.status && left.cause === right.cause &&
      left.from === right.from && left.to === right.to;
  }
}
