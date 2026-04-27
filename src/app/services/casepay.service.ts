import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfigService } from '../services/app-config.service';
import { LoggerService } from '../services/logger/logger.service';

@Injectable()
export class CasepayService {

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
    this.logger.log('[CASEPAY-SERV] - SERVER_BASE_PATH ', this.SERVER_BASE_PATH);
  }

  checkIfUserExistAndGetToken() {
    if (this.user) {
      this.TOKEN = this.user.token;
    } else {
      this.logger.log('[CASEPAY-SERV] - No user is signed in');
    }
  }

  public getPlans(): Observable<any[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'modules/payments/casepay/plans';
    this.logger.log('[CASEPAY-SERV] - GET PLANS - URL', url);

    return this._httpclient
      .get<any[]>(url, httpOptions);
  }

  public subscribe(projectId: string, planKey: string, billingPeriod: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'modules/payments/casepay/subscribe';
    this.logger.log('[CASEPAY-SERV] - SUBSCRIBE - URL', url);

    const body = { projectId: projectId, planKey: planKey, billingPeriod: billingPeriod };

    return this._httpclient
      .post<any>(url, body, httpOptions);
  }

  public cancel(projectId: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'modules/payments/casepay/cancel';
    this.logger.log('[CASEPAY-SERV] - CANCEL - URL', url);

    const body = { projectId: projectId };

    return this._httpclient
      .post<any>(url, body, httpOptions);
  }

  public getStatus(projectId: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'modules/payments/casepay/status/' + projectId;
    this.logger.log('[CASEPAY-SERV] - GET STATUS - URL', url);

    return this._httpclient
      .get<any>(url, httpOptions);
  }

  public getHistory(projectId: string): Observable<any[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + 'modules/payments/casepay/history/' + projectId;
    this.logger.log('[CASEPAY-SERV] - GET HISTORY - URL', url);

    return this._httpclient
      .get<any[]>(url, httpOptions);
  }
}
