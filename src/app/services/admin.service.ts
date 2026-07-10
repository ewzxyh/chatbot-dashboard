import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AppConfigService } from '../services/app-config.service';
import { LoggerService } from '../services/logger/logger.service';

export type OperationalStatus = 'ok' | 'degraded' | 'down' | 'unknown';
export type SnapshotState = 'fresh' | 'stale' | 'missing';
export type OperationalProduct = 'casezap' | 'waba' | 'unknown';
export type OperationalChannel = 'casezap' | 'waba' | 'webhook';
export type AlertStatus = 'open' | 'resolved';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type OperationalCauseCode =
  | 'provider_check_failed'
  | 'disabled'
  | 'not_configured'
  | 'not_ready'
  | 'mongo_not_ready'
  | 'mongo_unavailable'
  | 'redis_unavailable'
  | 'rabbitmq_unavailable'
  | 'storage_unavailable'
  | 'storage_read_verification_failed'
  | 'queue_backlog'
  | 'queue_unacked'
  | 'queue_no_consumers'
  | 'upstream_timeout'
  | 'provider_timeout'
  | 'provider_unreachable'
  | 'provider_status_unknown'
  | 'provider_status_ok'
  | 'provider_status_active'
  | 'provider_status_connected'
  | 'provider_status_open'
  | 'provider_status_pending'
  | 'provider_status_disconnected'
  | 'provider_status_banned'
  | 'provider_status_restricted'
  | 'provider_not_connected'
  | 'provider_not_logged_in'
  | 'provider_cannot_send_new_messages'
  | 'provider_message_capping_unavailable'
  | 'provider_reachout_timelock'
  | 'provider_quality_red'
  | 'provider_quality_yellow'
  | 'missing_casezap_domain'
  | 'missing_casezap_token'
  | 'missing_waba_id'
  | 'missing_waba_phone_number_id'
  | 'missing_waba_token'
  | 'unsupported_channel'
  | 'webhook_failure';

export interface OperationalStatusCounts {
  ok: number;
  degraded: number;
  down: number;
  unknown: number;
}

export interface OperationalCause {
  cause: OperationalCauseCode;
  count: number;
}

export interface OperationalSnapshotItem {
  name: string;
  status: OperationalStatus;
  cause: OperationalCauseCode | null;
  checkedAt: string;
}

export interface HealthSummaryV2 {
  version: 2;
  overallStatus: OperationalStatus;
  snapshotState: SnapshotState;
  generatedAt: string | null;
  expiresAt: string | null;
  services: OperationalSnapshotItem[];
  queues: OperationalSnapshotItem[];
  channels: {
    count: number;
    byStatus: OperationalStatusCounts;
    byProduct: Record<OperationalProduct, OperationalStatusCounts>;
    topCauses: OperationalCause[];
  };
  alerts: {
    count: number;
    byStatus: OperationalStatusCounts;
    topCauses: OperationalCause[];
  };
}

interface OperationalPageFilters {
  page?: number;
  limit?: number;
  product?: OperationalProduct;
  cause?: OperationalCauseCode;
  from?: string;
  to?: string;
}

export interface ChannelDiagnosticFilters extends OperationalPageFilters {
  channel?: OperationalChannel;
  status?: OperationalStatus;
}

export interface OperationalAlertFilters extends OperationalPageFilters {
  channel?: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  type?: string;
  service?: string;
  project_id?: string;
}

export interface PagedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
}

export interface ChannelDiagnostic {
  id: string;
  integrationId: string;
  id_project: string;
  name: string;
  product: 'casezap' | 'waba';
  channel: OperationalChannel;
  status: OperationalStatus;
  cause: OperationalCauseCode | null;
  checkedAt: string | null;
}

export interface OperationalAlert {
  id: string;
  key: string;
  type: string;
  product: OperationalProduct | null;
  severity: AlertSeverity;
  status: AlertStatus;
  cause: OperationalCauseCode | null;
  title?: string;
  service?: string;
  queue?: string;
  channel?: string;
  id_project?: string;
  integrationId?: string;
  firstAt: string | null;
  lastAt: string | null;
  resolvedAt: string | null;
  occurrences: number;
}

const CHANNEL_FILTER_KEYS: Array<keyof ChannelDiagnosticFilters> = [
  'page', 'limit', 'product', 'channel', 'status', 'cause', 'from', 'to'
];
const ALERT_FILTER_KEYS: Array<keyof OperationalAlertFilters> = [
  'page', 'limit', 'product', 'channel', 'status', 'cause', 'from', 'to',
  'type', 'severity', 'service', 'project_id'
];

@Injectable()
export class AdminService {

  SERVER_BASE_PATH: string;
  TOKEN: string;
  user: any;

  constructor(
    public auth: AuthService,
    public _httpclient: HttpClient,
    public appConfigService: AppConfigService,
    private logger: LoggerService
  ) {

    this.user = auth.user_bs.value;
    this.checkIfUserExistAndGetToken();

    this.auth.user_bs.subscribe(function (user) {
      this.user = user;
      this.checkIfUserExistAndGetToken();
    }.bind(this));

    this.getAppConfigAndBuildUrl();
  }

  getAppConfigAndBuildUrl() {
    this.SERVER_BASE_PATH = this.appConfigService.getConfig().SERVER_BASE_URL;
    this.logger.log('[ADMIN-SERV] - SERVER_BASE_PATH ', this.SERVER_BASE_PATH);
  }

  checkIfUserExistAndGetToken() {
    if (this.user) {
      this.TOKEN = this.user.token;
    } else {
      this.logger.log('[ADMIN-SERV] - No user is signed in');
    }
  }

  public getStats(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/stats';
    this.logger.log('[ADMIN-SERV] - GET STATS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public getProjects(page: number, limit: number, sortField: string, direction: number, filters: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    let url = this.SERVER_BASE_PATH + 'sadmin/projects'
      + '?page=' + page + '&limit=' + limit + '&sortField=' + sortField + '&direction=' + direction;
    if (filters && filters.planName) { url += '&planName=' + encodeURIComponent(filters.planName); }
    if (filters && filters.planType) { url += '&planType=' + encodeURIComponent(filters.planType); }
    this.logger.log('[ADMIN-SERV] - GET PROJECTS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public getUsers(page: number, limit: number, search: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    let url = this.SERVER_BASE_PATH + 'sadmin/users'
      + '?page=' + page + '&limit=' + limit;
    if (search) { url += '&search=' + encodeURIComponent(search); }
    this.logger.log('[ADMIN-SERV] - GET USERS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public getPayments(page: number, limit: number, filters: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    let url = this.SERVER_BASE_PATH + 'sadmin/payments'
      + '?page=' + page + '&limit=' + limit;
    if (filters && filters.status) { url += '&status=' + encodeURIComponent(filters.status); }
    this.logger.log('[ADMIN-SERV] - GET PAYMENTS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public updateProjectPlan(projectId: string, planKey: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/projects/' + projectId + '/plan';
    this.logger.log('[ADMIN-SERV] - UPDATE PROJECT PLAN - URL', url);

    const body = { planKey };

    return this._httpclient
      .put<any>(url, body, httpOptions);
  }

  public extendTrial(projectId: string, trialDays: number): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/projects/' + projectId + '/trial';
    this.logger.log('[ADMIN-SERV] - EXTEND TRIAL - URL', url);

    const body = { trialDays };

    return this._httpclient
      .put<any>(url, body, httpOptions);
  }

  public updateQuotas(projectId: string, quotas: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/projects/' + projectId + '/quotas';
    this.logger.log('[ADMIN-SERV] - UPDATE QUOTAS - URL', url);

    const body = { quotas };

    return this._httpclient
      .put<any>(url, body, httpOptions);
  }

  public getProjectUsage(projectId: string, includeStorage: boolean = true): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/usage-metering/projects/' + projectId
      + '?includeStorage=' + (includeStorage ? 'true' : 'false');
    this.logger.log('[ADMIN-SERV] - GET PROJECT USAGE - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public saveProjectUsageSnapshot(projectId: string, includeStorage: boolean = true): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/usage-metering/projects/' + projectId
      + '/snapshots?includeStorage=' + (includeStorage ? 'true' : 'false');
    this.logger.log('[ADMIN-SERV] - SAVE PROJECT USAGE SNAPSHOT - URL', url);

    return this._httpclient
      .post<any>(url, { source: 'manual' }, httpOptions);
  }

  public getProjectUsageSnapshots(projectId: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/usage-metering/projects/' + projectId + '/snapshots?limit=12';
    this.logger.log('[ADMIN-SERV] - GET PROJECT USAGE SNAPSHOTS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public exportProjectUsageCsv(projectId: string): Observable<string> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'text/csv',
        'Authorization': this.TOKEN
      }),
      responseType: 'text' as 'text'
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/usage-metering/projects/' + projectId + '/report.csv?limit=60';
    this.logger.log('[ADMIN-SERV] - EXPORT PROJECT USAGE CSV - URL', url);

    return this._httpclient
      .get(url, httpOptions);
  }

  public getProjectBillingLifecycle(projectId: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/projects/' + projectId + '/billing-lifecycle';
    this.logger.log('[ADMIN-SERV] - GET PROJECT BILLING LIFECYCLE - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public applyProjectBillingAction(projectId: string, action: string, reason: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/projects/' + projectId + '/billing-lifecycle/actions';
    this.logger.log('[ADMIN-SERV] - APPLY PROJECT BILLING ACTION - URL', url);

    return this._httpclient
      .post<any>(url, { action, reason }, httpOptions);
  }

  public getBillingLifecycleJobStatus(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/billing-lifecycle/job/status';
    this.logger.log('[ADMIN-SERV] - GET BILLING LIFECYCLE JOB STATUS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public runBillingLifecycleJob(options: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/billing-lifecycle/job/run';
    this.logger.log('[ADMIN-SERV] - RUN BILLING LIFECYCLE JOB - URL', url);

    return this._httpclient
      .post<any>(url, options || {}, httpOptions);
  }

  public getHealthSummary(): Observable<HealthSummaryV2> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/health/summary';
    this.logger.log('[ADMIN-SERV] - GET HEALTH SUMMARY - URL', url);

    return this._httpclient
      .get<HealthSummaryV2>(url, httpOptions);
  }

  public getOperationalHealthSummary(): Observable<HealthSummaryV2> {
    return this.getHealthSummary();
  }

  public getOperationalChannels(filters: ChannelDiagnosticFilters = {}): Observable<PagedResponse<ChannelDiagnostic>> {
    return this.getOperationalPage<ChannelDiagnostic, ChannelDiagnosticFilters>(
      'sadmin/health/channels', filters, CHANNEL_FILTER_KEYS
    );
  }

  public getOperationalAlerts(filters: OperationalAlertFilters = {}): Observable<PagedResponse<OperationalAlert>> {
    return this.getOperationalPage<OperationalAlert, OperationalAlertFilters>(
      'sadmin/operational-alerts', filters, ALERT_FILTER_KEYS
    );
  }

  private getOperationalPage<T, Filters extends object>(
    path: string,
    filters: Filters,
    filterKeys: Array<keyof Filters>
  ): Observable<PagedResponse<T>> {
    const url = this.SERVER_BASE_PATH + path;
    this.logger.log('[ADMIN-SERV] - GET OPERATIONAL PAGE - URL', url);

    return this._httpclient.get<PagedResponse<T>>(url, {
      headers: this.getOperationalHeaders(),
      params: this.buildOperationalParams(filters, filterKeys)
    });
  }

  private getOperationalHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': this.TOKEN
    });
  }

  private buildOperationalParams<Filters extends object>(
    filters: Filters,
    filterKeys: Array<keyof Filters>
  ): HttpParams {
    let params = new HttpParams();
    for (const key of filterKeys) {
      const value = filters[key];
      if (value !== undefined && value !== '') params = params.set(String(key), String(value));
    }
    return params;
  }

  public testChannelConnection(channel: string, integrationId: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/health/channels/test';
    this.logger.log('[ADMIN-SERV] - TEST CHANNEL CONNECTION - URL', url);

    return this._httpclient
      .post<any>(url, { channel, integrationId }, httpOptions);
  }

  public registerChannelWebhook(channel: string, integrationId: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/health/channels/webhook/register';
    this.logger.log('[ADMIN-SERV] - REGISTER CHANNEL WEBHOOK - URL', url);

    return this._httpclient
      .post<any>(url, { channel, integrationId }, httpOptions);
  }

  public testStorageConnection(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/health/storage/test';
    this.logger.log('[ADMIN-SERV] - TEST STORAGE CONNECTION - URL', url);

    return this._httpclient
      .post<any>(url, {}, httpOptions);
  }

  public testOperationalAlertNotification(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/operational-alerts/test-notification';
    this.logger.log('[ADMIN-SERV] - TEST OPERATIONAL ALERT NOTIFICATION - URL', url);

    return this._httpclient
      .post<any>(url, {}, httpOptions);
  }

  public getOperationalEvents(filters: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    let url = this.SERVER_BASE_PATH + 'sadmin/operational-events?limit=10';
    if (filters && filters.channel) { url += '&channel=' + encodeURIComponent(filters.channel); }
    if (filters && filters.level) { url += '&level=' + encodeURIComponent(filters.level); }
    if (filters && filters.project_id) { url += '&project_id=' + encodeURIComponent(filters.project_id); }
    if (filters && filters.integrationId) { url += '&integrationId=' + encodeURIComponent(filters.integrationId); }
    this.logger.log('[ADMIN-SERV] - GET OPERATIONAL EVENTS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public getOperationalMetrics(filters: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    let url = this.SERVER_BASE_PATH + 'sadmin/operational-metrics?range=' + encodeURIComponent(filters && filters.range ? filters.range : '24h');
    if (filters && filters.bucket) { url += '&bucket=' + encodeURIComponent(filters.bucket); }
    if (filters && filters.channel) { url += '&channel=' + encodeURIComponent(filters.channel); }
    if (filters && filters.project_id) { url += '&project_id=' + encodeURIComponent(filters.project_id); }
    this.logger.log('[ADMIN-SERV] - GET OPERATIONAL METRICS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public getAuditEvents(filters: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    let url = this.SERVER_BASE_PATH + 'sadmin/audit-events'
      + '?page=' + encodeURIComponent(filters && filters.page !== undefined ? filters.page : 0)
      + '&limit=' + encodeURIComponent(filters && filters.limit ? filters.limit : 10);
    if (filters && filters.action) { url += '&action=' + encodeURIComponent(filters.action); }
    if (filters && filters.method) { url += '&method=' + encodeURIComponent(filters.method); }
    if (filters && filters.project_id) { url += '&project_id=' + encodeURIComponent(filters.project_id); }
    if (filters && filters.actor) { url += '&actor=' + encodeURIComponent(filters.actor); }
    if (filters && filters.entityType) { url += '&entityType=' + encodeURIComponent(filters.entityType); }
    if (filters && filters.entityId) { url += '&entityId=' + encodeURIComponent(filters.entityId); }
    if (filters && filters.resource) { url += '&resource=' + encodeURIComponent(filters.resource); }
    if (filters && filters.success) { url += '&success=' + encodeURIComponent(filters.success); }
    if (filters && filters.search) { url += '&search=' + encodeURIComponent(filters.search); }
    if (filters && filters.from) { url += '&from=' + encodeURIComponent(filters.from); }
    if (filters && filters.to) { url += '&to=' + encodeURIComponent(filters.to); }
    this.logger.log('[ADMIN-SERV] - GET AUDIT EVENTS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public getAuditSummary(filters: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    let url = this.SERVER_BASE_PATH + 'sadmin/audit-events/summary?range='
      + encodeURIComponent(filters && filters.range ? filters.range : '24h');
    if (filters && filters.project_id) { url += '&project_id=' + encodeURIComponent(filters.project_id); }
    if (filters && filters.from) { url += '&from=' + encodeURIComponent(filters.from); }
    if (filters && filters.to) { url += '&to=' + encodeURIComponent(filters.to); }
    this.logger.log('[ADMIN-SERV] - GET AUDIT SUMMARY - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public getPrivacyConfig(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/privacy/config';
    this.logger.log('[ADMIN-SERV] - GET PRIVACY CONFIG - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public getPrivacyRetentionStatus(projectId?: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    let url = this.SERVER_BASE_PATH + 'sadmin/privacy/retention/status';
    if (projectId) { url += '?project_id=' + encodeURIComponent(projectId); }
    this.logger.log('[ADMIN-SERV] - GET PRIVACY RETENTION STATUS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public runPrivacyRetention(projectId: string, dryRun: boolean): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/privacy/retention/run';
    this.logger.log('[ADMIN-SERV] - RUN PRIVACY RETENTION - URL', url);

    return this._httpclient
      .post<any>(url, {
        project_id: projectId || undefined,
        dryRun: dryRun,
        confirm: dryRun ? undefined : true
      }, httpOptions);
  }

  public exportPrivacyContact(projectId: string, identifier: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/privacy/contact-export';
    this.logger.log('[ADMIN-SERV] - EXPORT PRIVACY CONTACT - URL', url);

    return this._httpclient
      .post<any>(url, { project_id: projectId, identifier: identifier }, httpOptions);
  }

  public anonymizePrivacyContact(projectId: string, identifier: string, reason: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'sadmin/privacy/contact-anonymize';
    this.logger.log('[ADMIN-SERV] - ANONYMIZE PRIVACY CONTACT - URL', url);

    return this._httpclient
      .post<any>(url, {
        project_id: projectId,
        identifier: identifier,
        reason: reason,
        confirm: true
      }, httpOptions);
  }
}
