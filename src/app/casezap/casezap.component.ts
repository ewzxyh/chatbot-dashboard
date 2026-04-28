import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IntegrationService } from '../services/integration.service';
import { AuthService } from '../core/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfigService } from '../services/app-config.service';

@Component({
  selector: 'app-casezap',
  templateUrl: './casezap.component.html',
  styleUrls: ['./casezap.component.scss']
})
export class CasezapComponent implements OnInit, OnDestroy {
  number = '';
  domain = '';
  token = '';
  instanceName = '';
  status = '';
  loading = true;
  saving = false;
  error = '';
  success = '';
  existingIntegration: any = null;
  projectId: string;
  serverBaseUrl: string;
  TOKEN: string;
  private subs: Subscription[] = [];
  private dataLoaded = false;

  constructor(
    private integrationService: IntegrationService,
    private auth: AuthService,
    private http: HttpClient,
    private appConfig: AppConfigService
  ) {
    this.serverBaseUrl = this.appConfig.getConfig().SERVER_BASE_URL;
  }

  ngOnInit() {
    this.subs.push(this.auth.project_bs.subscribe((project) => {
      if (project) {
        this.projectId = project._id;
        if (!this.dataLoaded) {
          this.dataLoaded = true;
          this.loadExisting();
        }
      }
    }));
    this.subs.push(this.auth.user_bs.subscribe((user) => {
      if (user) {
        this.TOKEN = user.token;
      }
    }));
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadExisting() {
    this.loading = true;
    this.integrationService.getIntegrationByName('casezap').subscribe(
      (integration: any) => {
        this.loading = false;
        if (integration && integration.value) {
          this.existingIntegration = integration;
          this.number = integration.value.number || '';
          this.domain = integration.value.domain || '';
          this.token = integration.value.token || '';
          this.instanceName = integration.value.instanceName || '';
          this.status = integration.value.status || 'unknown';
        }
      },
      () => {
        this.loading = false;
      }
    );
  }

  save() {
    if (!this.number || !this.domain || !this.token || !this.instanceName) {
      this.error = 'Todos os campos sao obrigatorios';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const data = {
      name: 'casezap',
      value: {
        number: this.number,
        domain: this.domain,
        token: this.token,
        instanceName: this.instanceName
      }
    };

    this.integrationService.saveIntegration(data).subscribe(
      (result: any) => {
        this.existingIntegration = result;
        this.registerWebhook();
      },
      (err: any) => {
        this.saving = false;
        if (err.status === 409) {
          this.error = 'Esta instancia ja esta conectada em outro projeto';
        } else if (err.status === 403) {
          this.error = 'Limite de plataformas atingido no seu plano';
        } else {
          this.error = 'Erro ao salvar integracao';
        }
      }
    );
  }

  registerWebhook() {
    const url = this.serverBaseUrl + 'modules/casezap/register/' + this.projectId;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.TOKEN
    });
    const body = { baseUrl: this.serverBaseUrl.replace(/\/$/, '') };

    this.http.post(url, body, { headers }).subscribe(
      () => {
        this.saving = false;
        this.success = 'CaseZap conectado com sucesso!';
        this.status = 'active';
      },
      (err: any) => {
        this.saving = false;
        this.error = err.error?.error || 'Erro ao registrar webhook';
      }
    );
  }

  remove() {
    if (!this.existingIntegration) return;
    if (!confirm('Deseja remover a integracao CaseZap?')) return;

    this.saving = true;
    this.integrationService.deleteIntegration(this.existingIntegration._id).subscribe(
      () => {
        this.saving = false;
        this.existingIntegration = null;
        this.number = '';
        this.domain = '';
        this.token = '';
        this.instanceName = '';
        this.status = '';
        this.success = 'Integracao removida';
      },
      () => {
        this.saving = false;
        this.error = 'Erro ao remover integracao';
      }
    );
  }
}
