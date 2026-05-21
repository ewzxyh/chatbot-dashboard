import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfigService } from '../services/app-config.service';
import { LoggerService } from '../services/logger/logger.service';

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

  public getHealthSummary(): Observable<any> {
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
      .get<any>(url, httpOptions);
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
    let url = this.SERVER_BASE_PATH + 'sadmin/operational-events?limit=100';
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
}
