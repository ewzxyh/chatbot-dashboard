import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-privacy',
  templateUrl: './admin-privacy.component.html',
  styleUrls: ['./admin-privacy.component.scss']
})
export class AdminPrivacyComponent implements OnInit {
  config: any = null;
  projectId = '';
  retentionProjectId = '';
  identifier = '';
  reason = '';
  exportResult: any = null;
  anonymizeResult: any = null;
  retentionStatus: any = null;
  retentionResult: any = null;
  errorMessage = '';
  successMessage = '';
  isLoadingConfig = false;
  isLoadingRetention = false;
  isRunningRetention = false;
  isExporting = false;
  isAnonymizing = false;

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.loadConfig();
    this.loadRetentionStatus();
  }

  retry() {
    this.errorMessage = '';
    this.loadConfig();
    this.loadRetentionStatus();
  }

  loadConfig() {
    this.isLoadingConfig = true;
    this.adminService.getPrivacyConfig().subscribe(
      (res) => {
        this.config = res && res.config ? res.config : null;
        this.isLoadingConfig = false;
      },
      () => {
        this.config = null;
        this.errorMessage = 'Erro ao carregar configuração de privacidade';
        this.isLoadingConfig = false;
      }
    );
  }

  loadRetentionStatus() {
    this.isLoadingRetention = true;
    this.adminService.getPrivacyRetentionStatus(this.retentionProjectId).subscribe(
      (res) => {
        this.retentionStatus = res;
        this.isLoadingRetention = false;
      },
      (err) => {
        this.errorMessage = this.errorFrom(err, 'Erro ao carregar status de retenção');
        this.retentionStatus = null;
        this.isLoadingRetention = false;
      }
    );
  }

  runRetention(dryRun: boolean) {
    if (!dryRun) {
      var confirmed = window.confirm('Executar limpeza de retenção? Esta ação remove dados antigos conforme a política configurada.');
      if (!confirmed) return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.retentionResult = null;
    this.isRunningRetention = true;
    this.adminService.runPrivacyRetention(this.retentionProjectId, dryRun).subscribe(
      (res) => {
        this.retentionResult = res;
        this.retentionStatus = res;
        this.successMessage = dryRun ? 'Simulação de retenção concluída' : 'Retenção executada com sucesso';
        this.isRunningRetention = false;
      },
      (err) => {
        this.errorMessage = this.errorFrom(err, 'Erro ao executar retenção');
        this.isRunningRetention = false;
      }
    );
  }

  canSubmit(): boolean {
    return !!this.projectId && !!this.identifier;
  }

  exportContact() {
    if (!this.canSubmit()) {
      this.errorMessage = 'Informe o projeto e o identificador do contato';
      return;
    }
    this.errorMessage = '';
    this.successMessage = '';
    this.exportResult = null;
    this.isExporting = true;
    this.adminService.exportPrivacyContact(this.projectId, this.identifier).subscribe(
      (res) => {
        this.exportResult = res;
        this.successMessage = 'Exportação LGPD concluída';
        this.isExporting = false;
      },
      (err) => {
        this.errorMessage = this.errorFrom(err, 'Erro ao exportar dados do contato');
        this.isExporting = false;
      }
    );
  }

  anonymizeContact() {
    if (!this.canSubmit()) {
      this.errorMessage = 'Informe o projeto e o identificador do contato';
      return;
    }
    if (!this.reason) {
      this.errorMessage = 'Informe o motivo da anonimização';
      return;
    }
    var confirmed = window.confirm('Anonimizar dados pessoais deste contato? Esta ação altera conversas e mensagens relacionadas.');
    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.anonymizeResult = null;
    this.isAnonymizing = true;
    this.adminService.anonymizePrivacyContact(this.projectId, this.identifier, this.reason).subscribe(
      (res) => {
        this.anonymizeResult = res;
        this.successMessage = 'Contato anonimizado com sucesso';
        this.isAnonymizing = false;
      },
      (err) => {
        this.errorMessage = this.errorFrom(err, 'Erro ao anonimizar contato');
        this.isAnonymizing = false;
      }
    );
  }

  errorFrom(err: any, fallback: string): string {
    if (err && err.error && err.error.error) return err.error.error;
    return fallback;
  }

  asJson(value: any): string {
    if (value === undefined || value === null) return '{}';
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      return String(value);
    }
  }
}
