import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-projects',
  templateUrl: './admin-projects.component.html'
})
export class AdminProjectsComponent implements OnInit {
  projects: any[] = [];
  totalCount = 0;
  page = 0;
  limit = 20;
  isLoading = true;
  filterPlanName = '';
  filterPlanType = '';
  showPlanModal = false;
  showTrialModal = false;
  showQuotasModal = false;
  showUsageModal = false;
  showBillingModal = false;
  selectedProject: any = null;
  modalPlanKey = '';
  modalTrialDays = 14;
  modalQuotas: any = { contacts: 0, platforms: 0, agents: 0, chatbots: 0, kbs: 0 };
  modalMessage = '';
  usageSnapshot: any = null;
  usageSnapshots: any[] = [];
  usageLoading = false;
  usageSnapshotLoading = false;
  usageError = '';
  usageSnapshotMessage = '';
  billingLifecycle: any = null;
  billingEvents: any[] = [];
  billingLoading = false;
  billingActionLoading = false;
  billingReason = '';
  billingMessage = '';
  billingJobStatus: any = null;
  billingJobResult: any = null;
  billingJobLoading = false;
  billingJobMessage = '';
  planDisplayNames: any = { Free: 'Iniciante', Starter: 'Standard', Pro: 'Pro', Business: 'Enterprise', Custom: 'Custom' };

  constructor(private adminService: AdminService) { }
  ngOnInit() {
    this.loadProjects();
    this.loadBillingJobStatus();
  }

  loadProjects() {
    this.isLoading = true;
    const filters: any = {};
    if (this.filterPlanName) filters.planName = this.filterPlanName;
    if (this.filterPlanType) filters.planType = this.filterPlanType;
    this.adminService.getProjects(this.page, this.limit, 'createdAt', -1, filters).subscribe(
      (res) => { this.projects = res.data; this.totalCount = res.count; this.isLoading = false; },
      (err) => { console.error('[ADMIN-PROJECTS] loadProjects error', err); this.isLoading = false; }
    );
  }

  nextPage() { if ((this.page + 1) * this.limit < this.totalCount) { this.page++; this.loadProjects(); } }
  prevPage() { if (this.page > 0) { this.page--; this.loadProjects(); } }

  openPlanModal(p: any) { this.selectedProject = p; this.modalPlanKey = ''; this.modalMessage = ''; this.showPlanModal = true; }
  savePlan() {
    if (!this.modalPlanKey) return;
    this.adminService.updateProjectPlan(this.selectedProject._id, this.modalPlanKey).subscribe(
      (res) => { this.modalMessage = 'Plano alterado.' + (res.warning ? ' ' + res.warning : ''); this.loadProjects(); },
      (err) => { this.modalMessage = 'Erro: ' + (err.error?.error || 'Falha'); }
    );
  }

  openTrialModal(p: any) { this.selectedProject = p; this.modalTrialDays = 14; this.modalMessage = ''; this.showTrialModal = true; }
  saveTrial() {
    this.adminService.extendTrial(this.selectedProject._id, this.modalTrialDays).subscribe(
      (res) => { this.modalMessage = 'Trial estendido.' + (res.warning ? ' ' + res.warning : ''); this.loadProjects(); },
      (err) => { this.modalMessage = 'Erro: ' + (err.error?.error || 'Falha'); }
    );
  }

  openQuotasModal(p: any) {
    this.selectedProject = p;
    this.modalQuotas = {
      contacts: p.profile?.quotes?.contacts || 0, platforms: p.profile?.quotes?.platforms || 0,
      agents: p.profile?.agents || 0, chatbots: p.profile?.quotes?.chatbots || 0, kbs: p.profile?.quotes?.kbs || 0
    };
    this.modalMessage = '';
    this.showQuotasModal = true;
  }
  saveQuotas() {
    this.adminService.updateQuotas(this.selectedProject._id, this.modalQuotas).subscribe(
      (res) => { this.modalMessage = 'Quotas atualizadas.'; this.loadProjects(); },
      (err) => { this.modalMessage = 'Erro: ' + (err.error?.error || 'Falha'); }
    );
  }

  openUsageModal(p: any) {
    this.selectedProject = p;
    this.usageSnapshot = null;
    this.usageSnapshots = [];
    this.usageError = '';
    this.usageSnapshotMessage = '';
    this.usageLoading = true;
    this.showUsageModal = true;

    this.adminService.getProjectUsage(p._id, true).subscribe(
      (res) => { this.usageSnapshot = res; this.usageLoading = false; },
      (err) => {
        this.usageError = 'Erro: ' + (err.error?.error || 'Falha ao carregar uso');
        this.usageLoading = false;
      }
    );
    this.loadUsageSnapshots(p._id);
  }

  loadUsageSnapshots(projectId: string) {
    this.usageSnapshotLoading = true;
    this.adminService.getProjectUsageSnapshots(projectId).subscribe(
      (res) => {
        this.usageSnapshots = res.data || [];
        this.usageSnapshotLoading = false;
      },
      () => { this.usageSnapshotLoading = false; }
    );
  }

  saveUsageSnapshot() {
    if (!this.selectedProject) return;
    this.usageSnapshotMessage = 'Salvando...';
    this.adminService.saveProjectUsageSnapshot(this.selectedProject._id, true).subscribe(
      (res) => {
        this.usageSnapshotMessage = 'Snapshot salvo: ' + res.periodKey;
        this.loadUsageSnapshots(this.selectedProject._id);
      },
      (err) => { this.usageSnapshotMessage = 'Erro: ' + (err.error?.error || 'Falha ao salvar snapshot'); }
    );
  }

  exportUsageCsv() {
    if (!this.selectedProject) return;
    this.adminService.exportProjectUsageCsv(this.selectedProject._id).subscribe(
      (csv) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'usage-metering-' + this.selectedProject._id + '.csv';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      (err) => { this.usageSnapshotMessage = 'Erro: ' + (err.error?.error || 'Falha ao exportar CSV'); }
    );
  }

  openBillingModal(p: any) {
    this.selectedProject = p;
    this.billingLifecycle = null;
    this.billingEvents = [];
    this.billingReason = '';
    this.billingMessage = '';
    this.billingLoading = true;
    this.showBillingModal = true;
    this.loadBillingLifecycle(p._id);
  }

  loadBillingLifecycle(projectId: string) {
    this.billingLoading = true;
    this.adminService.getProjectBillingLifecycle(projectId).subscribe(
      (res) => {
        this.billingLifecycle = res.summary;
        this.billingEvents = res.events || [];
        this.billingLoading = false;
      },
      (err) => {
        this.billingMessage = 'Erro: ' + (err.error?.error || 'Falha ao carregar billing');
        this.billingLoading = false;
      }
    );
  }

  applyBillingAction(action: string) {
    if (!this.selectedProject || this.billingActionLoading) return;
    this.billingActionLoading = true;
    this.billingMessage = 'Aplicando...';
    this.adminService.applyProjectBillingAction(this.selectedProject._id, action, this.billingReason).subscribe(
      (res) => {
        this.billingLifecycle = res.summary;
        this.billingMessage = 'Ação aplicada.';
        this.billingActionLoading = false;
        this.loadProjects();
        this.loadBillingLifecycle(this.selectedProject._id);
      },
      (err) => {
        this.billingMessage = 'Erro: ' + (err.error?.error || 'Falha');
        this.billingActionLoading = false;
      }
    );
  }

  loadBillingJobStatus() {
    this.adminService.getBillingLifecycleJobStatus().subscribe(
      (res) => { this.billingJobStatus = res.job || null; },
      (err) => { this.billingJobMessage = 'Erro ao carregar job: ' + (err.error?.error || 'Falha'); }
    );
  }

  runBillingJob(dryRun: boolean) {
    if (this.billingJobLoading) return;
    if (!dryRun && !window.confirm('Executar o billing automático agora? Isso pode suspender projetos, enviar avisos e aplicar downgrade para Free.')) {
      return;
    }
    this.billingJobLoading = true;
    this.billingJobMessage = dryRun ? 'Simulando billing automático...' : 'Executando billing automático...';
    this.billingJobResult = null;
    const payload: any = { dryRun: dryRun };
    if (!dryRun) payload.confirm = true;

    this.adminService.runBillingLifecycleJob(payload).subscribe(
      (res) => {
        this.billingJobResult = res.result || null;
        this.billingJobStatus = res.job || this.billingJobStatus;
        this.billingJobMessage = dryRun ? 'Simulação concluída.' : 'Execução concluída.';
        this.billingJobLoading = false;
        this.loadProjects();
      },
      (err) => {
        this.billingJobMessage = 'Erro: ' + (err.error?.error || 'Falha ao executar billing automático');
        this.billingJobLoading = false;
      }
    );
  }

  billingStatusLabel(status: string): string {
    const labels: any = {
      free: 'Free',
      trialing: 'Trial',
      pending_authorization: 'Pendente',
      active: 'Ativo',
      grace_period: 'Grace',
      past_due: 'Atrasado',
      suspended: 'Suspenso',
      canceled: 'Cancelado'
    };
    return labels[status] || status || 'N/D';
  }

  formatBytes(bytes: number): string {
    if (bytes === null || bytes === undefined) return 'N/D';
    const value = Number(bytes || 0);
    if (value < 1024) return value + ' B';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
    if (value < 1024 * 1024 * 1024) return (value / (1024 * 1024)).toFixed(1) + ' MB';
    return (value / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  usageValue(metric: any): string {
    if (!metric) return '0';
    const current = metric.current || 0;
    return metric.limit ? current + ' / ' + metric.limit : String(current);
  }

  usageEntries(value: any): any[] {
    if (!value) return [];
    return Object.keys(value)
      .map((key) => ({ key: key || 'unknown', label: this.usageMetricLabel(key), value: value[key] || 0 }))
      .sort((a, b) => b.value - a.value);
  }

  usageMetricLabel(key: string): string {
    const labels: any = {
      casezap: 'CaseZap',
      whatsapp: 'WhatsApp',
      waba: 'WABA',
      telegram: 'Telegram',
      messenger: 'Messenger',
      sms: 'SMS',
      voice: 'Voz',
      text: 'Texto',
      image: 'Imagem',
      file: 'Arquivo',
      document: 'Documento',
      audio: 'Audio',
      video: 'Video',
      contact: 'Contato',
      location: 'Localizacao',
      sticker: 'Figurinha',
      poll: 'Enquete',
      event: 'Evento',
      unknown: 'Nao identificado'
    };
    return labels[key] || key;
  }

  closeModals() {
    this.showPlanModal = false;
    this.showTrialModal = false;
    this.showQuotasModal = false;
    this.showUsageModal = false;
    this.showBillingModal = false;
    this.selectedProject = null;
    this.modalMessage = '';
    this.usageSnapshot = null;
    this.usageSnapshots = [];
    this.usageError = '';
    this.usageSnapshotMessage = '';
    this.billingLifecycle = null;
    this.billingEvents = [];
    this.billingReason = '';
    this.billingMessage = '';
    this.billingActionLoading = false;
  }
}
