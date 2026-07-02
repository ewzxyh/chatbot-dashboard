import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class SleekplanSsoService {
  constructor(
    private httpClient: HttpClient,
    private appConfigService: AppConfigService,
  ) { }

  // _getSsoToken(user: { id: string; name: string; email: string; image?: string }): Observable<{ token: string }> {
  //   return this.httpClient.post<{ token: string }>('/api/sleekplan/sso', user);
  // }

  getSsoToken(user: string) {
    // const httpOptions = {
    //   headers: new HttpHeaders({
    //     'Content-Type': 'application/json',
    //     'Authorization': this.TOKEN
    //   })
    // }
    let body = { user }
  
    const baseUrl = window['CHATCASE_SLEEKPLAN_SSO_BASE_URL'] || this.getConfigValue('chatcaseSleekplanSsoBaseUrl') || '';
    const url = baseUrl + '/api/sleekplan/sso'
    // console.log("sleekplan sso]  ", url);
    return this.httpClient.post(url, body );
  }

  private getConfigValue(key: string): any {
    const value = this.appConfigService.getConfig()?.[key];
    return typeof value === 'string' && value.indexOf('${') === 0 ? null : value;
  }

}
