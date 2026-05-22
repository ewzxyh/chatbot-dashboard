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
  identifier = '';
  reason = '';
  exportResult: any = null;
  anonymizeResult: any = null;
  errorMessage = '';
  successMessage = '';
  isLoadingConfig = false;
  isExporting = false;
  isAnonymizing = false;

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.loadConfig();
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
        this.errorMessage = 'Erro ao carregar configuracao de privacidade';
        this.isLoadingConfig = false;
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
        this.successMessage = 'Exportacao LGPD concluida';
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
      this.errorMessage = 'Informe o motivo da anonimizacao';
      return;
    }
    var confirmed = window.confirm('Anonimizar dados pessoais deste contato? Esta acao altera conversas e mensagens relacionadas.');
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
