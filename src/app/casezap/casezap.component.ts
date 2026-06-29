import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IntegrationService } from '../services/integration.service';
import { AuthService } from '../core/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfigService } from '../services/app-config.service';
import { CasepayService } from '../services/casepay.service';
import { ActivatedRoute, Router } from '@angular/router';

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
  expandedDiagnosticsId = '';
  diagnosticsById: { [key: string]: any } = {};
  diagnosticsLoadingById: { [key: string]: boolean } = {};
  diagnosticsErrorById: { [key: string]: string } = {};

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
    private casepayService: CasepayService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.serverBaseUrl = this.appConfig.getConfig().SERVER_BASE_URL;
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectid') || this.projectId;
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
    this.integrationService.getIntegrationInstances('casezap', this.projectId).subscribe(
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

  getIntegrationId(instance: any): string {
    return instance && instance._id ? String(instance._id) : '';
  }

  toggleDiagnostics(instance: any) {
    const id = this.getIntegrationId(instance);
    if (!id) return;

    if (this.expandedDiagnosticsId === id) {
      this.expandedDiagnosticsId = '';
      return;
    }

    this.expandedDiagnosticsId = id;
    if (!this.diagnosticsById[id]) {
      this.loadDiagnostics(instance, false);
    }
  }

  loadDiagnostics(instance: any, force = false) {
    const id = this.getIntegrationId(instance);
    if (!id) return;

    this.diagnosticsLoadingById[id] = true;
    this.diagnosticsErrorById[id] = '';
    this.integrationService.getIntegrationInstanceDiagnostics('casezap', id, this.projectId, force).subscribe(
      (diagnostics: any) => {
        this.diagnosticsLoadingById[id] = false;
        this.diagnosticsById[id] = diagnostics;
      },
      (err: any) => {
        this.diagnosticsLoadingById[id] = false;
        this.diagnosticsErrorById[id] = err && err.error && err.error.error ? err.error.error : 'Erro ao carregar diagnostico';
      }
    );
  }

  diagnosticLabel(value: string): string {
    if (value === 'ok') return 'OK';
    if (value === 'degraded') return 'Instavel';
    if (value === 'down') return 'Falha';
    if (value === 'active') return 'Conectado';
    if (value === 'disconnected') return 'Desconectado';
    if (value === 'success') return 'Sucesso';
    if (value === 'failed') return 'Falha';
    if (value === 'skipped') return 'Ignorado';
    return value || 'Desconhecido';
  }

  diagnosticStatusClass(value: string): string {
    if (value === 'ok' || value === 'active' || value === 'success') return 'ok';
    if (value === 'degraded' || value === 'skipped' || value === 'pending') return 'warn';
    if (value === 'down' || value === 'disconnected' || value === 'failed') return 'down';
    return 'unknown';
  }

  formatDiagnosticDate(value: string): string {
    if (!value) return 'Nunca';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Nunca';
    return date.toLocaleString('pt-BR');
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

  goToDepartments() {
    this.router.navigate(['project/' + this.projectId + '/departments']);
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
      this.integrationService.saveIntegration(data, this.projectId).subscribe(
        (result: any) => {
          this.registerWebhook(result._id);
        },
        (err: any) => {
          this.saving = false;
          if (err.status === 409) {
            this.error = 'Esta instância já está conectada em outro projeto';
          } else if (err.status === 403) {
            this.error = 'Limite de plataformas atingido no seu plano';
          } else {
            this.error = 'Erro ao salvar integração';
          }
        }
      );
    } else if (this.view === 'edit' && this.editingInstance) {
      this.integrationService.updateIntegration(this.editingInstance._id, { value }, this.projectId).subscribe(
        () => {
          this.registerWebhook(this.editingInstance._id);
        },
        () => {
          this.saving = false;
          this.error = 'Erro ao atualizar integração';
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
        this.success = this.view === 'add' ? 'Instância adicionada com sucesso!' : 'Instância atualizada com sucesso!';
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
    if (!confirm('Deseja remover esta instância CaseZap?')) return;

    this.saving = true;
    this.error = '';
    this.success = '';
    this.integrationService.deleteIntegration(instance._id, this.projectId).subscribe(
      () => {
        this.saving = false;
        this.success = 'Instância removida';
        this.loadInstances();
        this.loadQuota();
      },
      () => {
        this.saving = false;
        this.error = 'Erro ao remover instância';
      }
    );
  }

  truncateDomain(domain: string): string {
    if (!domain) return '';
    return domain.length > 35 ? domain.substring(0, 35) + '...' : domain;
  }
}
