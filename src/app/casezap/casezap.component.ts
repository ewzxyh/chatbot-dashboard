import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IntegrationService } from '../services/integration.service';
import { AuthService } from '../core/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfigService } from '../services/app-config.service';
import { CasepayService } from '../services/casepay.service';

@Component({
  selector: 'app-casezap',
  templateUrl: './casezap.component.html',
  styleUrls: ['./casezap.component.scss']
})
export class CasezapComponent implements OnInit, OnDestroy {
  instances: any[] = [];
  view: 'list' | 'add' | 'edit' = 'list';
  editingInstance: any = null;

  number = '';
  domain = '';
  token = '';
  instanceName = '';

  loading = true;
  saving = false;
  error = '';
  success = '';
  platformsUsed = 0;
  platformsLimit = 0;

  projectId: string;
  serverBaseUrl: string;
  TOKEN: string;
  private subs: Subscription[] = [];
  private dataLoaded = false;

  constructor(
    private integrationService: IntegrationService,
    private auth: AuthService,
    private http: HttpClient,
    private appConfig: AppConfigService,
    private casepayService: CasepayService
  ) {
    this.serverBaseUrl = this.appConfig.getConfig().SERVER_BASE_URL;
  }

  ngOnInit() {
    const user = this.auth.user_bs.value;
    if (user) {
      this.TOKEN = user.token;
    }
    this.subs.push(this.auth.user_bs.subscribe((u) => {
      if (u) {
        this.TOKEN = u.token;
      }
    }));
    this.subs.push(this.auth.project_bs.subscribe((project) => {
      if (project) {
        this.projectId = project._id;
        if (!this.dataLoaded) {
          this.dataLoaded = true;
          this.loadInstances();
          this.loadQuota();
        }
      }
    }));
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadInstances() {
    this.loading = true;
    this.integrationService.getIntegrationInstances('casezap').subscribe(
      (instances: any[]) => {
        this.loading = false;
        this.instances = instances || [];
      },
      () => {
        this.loading = false;
        this.instances = [];
      }
    );
  }

  loadQuota() {
    if (!this.projectId) return;
    this.casepayService.getStatus(this.projectId).subscribe(
      (status: any) => {
        if (status && status.usage && status.usage.platforms) {
          this.platformsUsed = status.usage.platforms.current || 0;
          this.platformsLimit = status.usage.platforms.limit || 0;
        }
      },
      () => {}
    );
  }

  startAdd() {
    this.view = 'add';
    this.editingInstance = null;
    this.number = '';
    this.domain = '';
    this.token = '';
    this.instanceName = '';
    this.error = '';
    this.success = '';
  }

  startEdit(instance: any) {
    this.view = 'edit';
    this.editingInstance = instance;
    this.number = instance.value?.number || '';
    this.domain = instance.value?.domain || '';
    this.token = instance.value?.token || '';
    this.instanceName = instance.value?.instanceName || '';
    this.error = '';
    this.success = '';
  }

  cancelForm() {
    this.view = 'list';
    this.editingInstance = null;
    this.error = '';
    this.success = '';
  }

  save() {
    if (!this.number || !this.domain || !this.token || !this.instanceName) {
      this.error = 'Todos os campos sao obrigatorios';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const value = {
      number: this.number,
      domain: this.domain,
      token: this.token,
      instanceName: this.instanceName
    };

    if (this.view === 'add') {
      const data = { name: 'casezap', value };
      this.integrationService.saveIntegration(data).subscribe(
        (result: any) => {
          this.registerWebhook(result._id);
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
    } else if (this.view === 'edit' && this.editingInstance) {
      this.integrationService.updateIntegration(this.editingInstance._id, { value }).subscribe(
        () => {
          this.registerWebhook(this.editingInstance._id);
        },
        () => {
          this.saving = false;
          this.error = 'Erro ao atualizar integracao';
        }
      );
    }
  }

  registerWebhook(integrationId: string) {
    const url = this.serverBaseUrl + 'modules/casezap/register/' + integrationId;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.TOKEN
    });

    this.http.post(url, {}, { headers }).subscribe(
      () => {
        this.saving = false;
        this.success = this.view === 'add' ? 'Instancia adicionada com sucesso!' : 'Instancia atualizada com sucesso!';
        this.view = 'list';
        this.editingInstance = null;
        this.loadInstances();
        this.loadQuota();
      },
      (err: any) => {
        this.saving = false;
        this.error = err.error?.error || 'Erro ao registrar webhook';
      }
    );
  }

  removeInstance(instance: any) {
    if (!confirm('Deseja remover esta instancia CaseZap?')) return;

    this.saving = true;
    this.error = '';
    this.success = '';
    this.integrationService.deleteIntegration(instance._id).subscribe(
      () => {
        this.saving = false;
        this.success = 'Instancia removida';
        this.loadInstances();
        this.loadQuota();
      },
      () => {
        this.saving = false;
        this.error = 'Erro ao remover instancia';
      }
    );
  }

  truncateDomain(domain: string): string {
    if (!domain) return '';
    return domain.length > 35 ? domain.substring(0, 35) + '...' : domain;
  }
}
