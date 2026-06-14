import { Injectable } from '@angular/core';
import { AuthService } from 'app/core/auth.service';
import { AppConfigService } from './app-config.service';
import { LoggerService } from './logger/logger.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {

  user: any;
  project_id: any;
  TOKEN: string;
  SERVER_BASE_PATH: string;

  constructor(
    private auth: AuthService,
    public appConfigService: AppConfigService,
    private logger: LoggerService,
    private http: HttpClient
  ) {
    
    // SUBSCRIBE TO USER BS
    this.user = auth.user_bs.value
    this.checkIfExistUserAndGetToken()

    this.auth.user_bs.subscribe((user) => {
      this.user = user;
      this.checkIfExistUserAndGetToken()
    }); 
    this.getCurrentProject();
    this.getAppConfig();
   }

   getAppConfig() {
    this.SERVER_BASE_PATH = this.appConfigService.getConfig().SERVER_BASE_URL;
    this.logger.log('AppConfigService getAppConfig (FAQ-KB SERV.) SERVER_BASE_PATH ', this.SERVER_BASE_PATH);
  }

  getCurrentProject() {

    this.auth.project_bs.subscribe((project) => {
      if (project) {
        this.project_id = project._id;
      }
    }, (error) => {
      this.logger.error('[INTEGRATION.SERV] - get current project ERROR: ', error);
    }, () => {
      this.logger.debug('[INTEGRATION.SERV] - get current project *COMPLETE*');
    });
  }

  checkIfExistUserAndGetToken() {
    if (this.user) {
      this.TOKEN = this.user.token
      this.logger.log('[INTEGRATION.SERV] user is signed in');
    } else {
      this.logger.log('[INTEGRATION.SERV] No user is signed in');
    }
  }

  getProjectId(projectId?: string) {
    return projectId || this.project_id;
  }

  getAllIntegrations(projectId?: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    }

    const url = this.SERVER_BASE_PATH + this.getProjectId(projectId) + "/integration";
    this.logger.debug('[INTEGRATION.SERV] - get integration URL: ', url);

    return this.http.get(url, httpOptions);
  }

  getIntegrationDetail(integration_id: string, projectId?: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    }

    const url = this.SERVER_BASE_PATH + this.getProjectId(projectId) + "/integration/" + integration_id;
    this.logger.debug('[INTEGRATION.SERV] - get integration URL: ', url);

    return this.http.get(url, httpOptions);
  }

  getIntegrationByName(name: string, projectId?: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    }

    const url = this.SERVER_BASE_PATH + this.getProjectId(projectId) + "/integration/name/" + name;
    this.logger.debug('[INTEGRATION.SERV] - get integration URL: ', url);

    return this.http.get(url, httpOptions);
  }

  saveIntegration(integration: any, projectId?: string) {
    this.logger.log('integration ', integration) 
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    }

    const url = this.SERVER_BASE_PATH + this.getProjectId(projectId) + "/integration/";
    this.logger.debug('[INTEGRATION.SERV] - save integration URL: ', url);

    return this.http.post(url, integration, httpOptions);
  }

  deleteIntegration(integration_id: string, projectId?: string) {

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    }

    const url = this.SERVER_BASE_PATH + this.getProjectId(projectId) + "/integration/" + integration_id;
    this.logger.debug('[INTEGRATION.SERV] - save integration URL: ', url);

    return this.http.delete(url, httpOptions);
  }

  updateIntegration(integration_id: string, data: any, projectId?: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + this.getProjectId(projectId) + '/integration/' + integration_id;
    return this.http.put(url, data, httpOptions);
  }

  getIntegrationInstances(name: string, projectId?: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const url = this.SERVER_BASE_PATH + this.getProjectId(projectId) + '/integration/name/' + name + '/instances';
    return this.http.get(url, httpOptions);
  }

  getIntegrationInstanceDiagnostics(name: string, integrationId: string, projectId?: string, force = false) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    };
    const suffix = force ? '?force=true' : '';
    const url = this.SERVER_BASE_PATH + this.getProjectId(projectId) + '/integration/name/' + name + '/instances/' + integrationId + '/diagnostics' + suffix;
    return this.http.get(url, httpOptions);
  }

  checkIntegrationKeyValidity(url: string, key?: string, api_key?: string) {
    
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (key) {
      headers = headers.append('Authorization', key)
    }

    if (api_key) {
      headers = headers.append('api-key', api_key)
    }

    const httpOptions = {
      headers: headers
    }

    return this.http.get(url, httpOptions);
  }

  checkAnthropicKeyValidity(url: string, api_key?: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'x-api-key': api_key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      })  
    }
    // console.log('checkAnthropicKeyValidity api_key ', api_key)
    // const headers = new HttpHeaders({
    //   'x-api-key': api_key,
    //   'anthropic-version': '2023-06-01'
    // });

    return this.http.get(url,  httpOptions );
  }

  /**
   * Retrieve MCP tools from server
   * @param serverUrl The URL of the MCP server
   * @returns Observable with tools array
   */
  getMcpTools(serverUrl: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
      })
    }

    const url = this.SERVER_BASE_PATH + this.project_id + "/mcp/tools";
    this.logger.debug('[INTEGRATION.SERV] - get MCP tools URL: ', url);
    this.logger.debug('[INTEGRATION.SERV] - server URL: ', serverUrl);

    const body = {
      url: serverUrl
    };

    return this.http.post(url, body, httpOptions);
  }


}
