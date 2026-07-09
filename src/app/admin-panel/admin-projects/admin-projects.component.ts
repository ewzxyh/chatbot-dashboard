import { Component, OnInit, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { AdminService } from '../../services/admin.service';
import { formatAdminText } from '../admin-text.util';

@Component({
  selector: 'app-admin-projects',
  templateUrl: './admin-projects.component.html'
})
export class AdminProjectsComponent implements OnInit {
  projects: any[] = [];
  displayedColumns = ['name', 'owner', 'plan', 'type', 'billing', 'contacts', 'members', 'createdAt', 'actions'];
  usageSnapshotColumns = ['label', 'value'];
  usageBreakdownColumns = ['label', 'value'];
  usageHistoryColumns = ['period', 'messages', 'media', 'cost'];
  billingSummaryColumns = ['label', 'value'];
  billingEventsColumns = ['date', 'event', 'status', 'plan'];
  totalCount = 0;
  page = 0;
  limit = 10;
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
  usageSnapshotRowsData: any[] = [];
  usageChannelRows: any[] = [];
  usageTypeRows: any[] = [];
  usageLoading = false;
  usageSnapshotLoading = false;
  usageError = '';
  usageSnapshotMessage = '';
  billingLifecycle: any = null;
  billingEvents: any[] = [];
  billingSummaryRowsData: any[] = [];
  billingLoading = false;
  billingActionLoading = false;
  billingReason = '';
  billingMessage = '';
  billingJobStatus: any = null;
  billingJobResult: any = null;
  billingJobLoading = false;
  billingJobMessage = '';
  impersonatingTargetId: string = null;
  impersonationError = '';
  planDisplayNames: any = { Free: 'Iniciante', Starter: 'Standard', Pro: 'Pro', Business: 'Enterprise', Custom: 'Custom' };
  private usageRequestSub: Subscription = null;
  private usageSnapshotsRequestSub: Subscription = null;
  private billingRequestSub: Subscription = null;
  private readonly modalRequestTimeoutMs = 20000;

  constructor(private adminService: AdminService, private dialog: MatDialog, private auth: AuthService) { }
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
  onPageChange(event: any) { this.page = event.pageIndex; this.limit = event.pageSize; this.loadProjects(); }

  private openProjectDialog(template: TemplateRef<any>, width: string = '480px') {
    this.dialog.closeAll();
    this.dialog.open(template, { width, maxWidth: '95vw', maxHeight: '90vh', autoFocus: false, panelClass: 'admin-dialog-panel' });
  }

  displayText(value: any): string {
    return formatAdminText(value);
  }

  impersonateProject(project: any) {
    if (!project || !project._id || this.impersonatingTargetId) return;
    if (!window.confirm('Acessar o dashboard do projeto ' + this.displayText(project.name) + '?')) return;

    this.impersonationError = '';
    this.impersonatingTargetId = project._id;
    this.auth.impersonate('project', project._id).subscribe(
      () => { },
      () => {
        this.impersonationError = 'Não foi possível acessar este projeto.';
        this.impersonatingTargetId = null;
      }
    );
  }

  private cancelProjectModalRequests() {
    if (this.usageRequestSub) this.usageRequestSub.unsubscribe();
    if (this.usageSnapshotsRequestSub) this.usageSnapshotsRequestSub.unsubscribe();
    if (this.billingRequestSub) this.billingRequestSub.unsubscribe();
    this.usageRequestSub = null;
    this.usageSnapshotsRequestSub = null;
    this.billingRequestSub = null;
  }

  openPlanModal(p: any, template?: TemplateRef<any>) {
    this.cancelProjectModalRequests();
    this.selectedProject = p; this.modalPlanKey = ''; this.modalMessage = ''; this.showPlanModal = true;
    if (template) this.openProjectDialog(template);
  }
  savePlan() {
    if (!this.modalPlanKey) return;
    this.adminService.updateProjectPlan(this.selectedProject._id, this.modalPlanKey).subscribe(
      () => { this.loadProjects(); this.closeModals(); },
      (err) => { this.modalMessage = 'Erro: ' + (err.error?.error || 'Falha'); }
    );
  }

  openTrialModal(p: any, template?: TemplateRef<any>) {
    this.cancelProjectModalRequests();
    this.selectedProject = p; this.modalTrialDays = 14; this.modalMessage = ''; this.showTrialModal = true;
    if (template) this.openProjectDialog(template);
  }
  saveTrial() {
    this.adminService.extendTrial(this.selectedProject._id, this.modalTrialDays).subscribe(
      () => { this.loadProjects(); this.closeModals(); },
      (err) => { this.modalMessage = 'Erro: ' + (err.error?.error || 'Falha'); }
    );
  }

  openQuotasModal(p: any, template?: TemplateRef<any>) {
    this.cancelProjectModalRequests();
    this.selectedProject = p;
    this.modalQuotas = {
      contacts: p.profile?.quotes?.contacts || 0, platforms: p.profile?.quotes?.platforms || 0,
      agents: p.profile?.agents || 0, chatbots: p.profile?.quotes?.chatbots || 0, kbs: p.profile?.quotes?.kbs || 0
    };
    this.modalMessage = '';
    this.showQuotasModal = true;
    if (template) this.openProjectDialog(template);
  }
  saveQuotas() {
    this.adminService.updateQuotas(this.selectedProject._id, this.modalQuotas).subscribe(
      () => { this.loadProjects(); this.closeModals(); },
      (err) => { this.modalMessage = 'Erro: ' + (err.error?.error || 'Falha'); }
    );
  }

  openUsageModal(p: any, template?: TemplateRef<any>) {
    this.cancelProjectModalRequests();
    this.selectedProject = p;
    this.usageSnapshot = null;
    this.usageSnapshots = [];
    this.usageSnapshotRowsData = [];
    this.usageChannelRows = [];
    this.usageTypeRows = [];
    this.usageError = '';
    this.usageSnapshotMessage = '';
    this.usageLoading = true;
    this.showUsageModal = true;
    if (template) this.openProjectDialog(template, '900px');

    this.usageRequestSub = this.adminService.getProjectUsage(p._id, true).pipe(timeout(this.modalRequestTimeoutMs)).subscribe(
      (res) => {
        this.usageSnapshot = res;
        this.usageSnapshotRowsData = this.buildUsageSnapshotRows(res);
        this.usageChannelRows = this.usageEntries(res && res.messages ? res.messages.byChannel : null).slice(0, 10);
        this.usageTypeRows = this.usageEntries(res && res.messages ? res.messages.byType : null).slice(0, 10);
        this.usageLoading = false;
      },
      (err) => {
        this.usageError = 'Erro: ' + (err.name === 'TimeoutError' ? 'Tempo esgotado ao carregar uso' : (err.error?.error || 'Falha ao carregar uso'));
        this.usageLoading = false;
      }
    );
    this.loadUsageSnapshots(p._id);
  }

  loadUsageSnapshots(projectId: string) {
    this.usageSnapshotLoading = true;
    this.usageSnapshotsRequestSub = this.adminService.getProjectUsageSnapshots(projectId).pipe(timeout(this.modalRequestTimeoutMs)).subscribe(
      (res) => {
        this.usageSnapshots = (res.data || []).slice(0, 10);
        this.usageSnapshotLoading = false;
      },
      () => {
        this.usageSnapshotMessage = 'Falha ao carregar histórico de uso.';
        this.usageSnapshotLoading = false;
      }
    );
  }

  saveUsageSnapshot() {
    if (!this.selectedProject) return;
    this.usageSnapshotMessage = 'Salvando...';
    this.adminService.saveProjectUsageSnapshot(this.selectedProject._id, true).subscribe(
      () => {
        this.closeModals();
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

  openBillingModal(p: any, template?: TemplateRef<any>) {
    this.cancelProjectModalRequests();
    this.selectedProject = p;
    this.billingLifecycle = null;
    this.billingEvents = [];
    this.billingSummaryRowsData = [];
    this.billingReason = '';
    this.billingMessage = '';
    this.billingLoading = true;
    this.showBillingModal = true;
    if (template) this.openProjectDialog(template, '820px');
    this.loadBillingLifecycle(p._id);
  }

  loadBillingLifecycle(projectId: string) {
    this.billingLoading = true;
    this.billingRequestSub = this.adminService.getProjectBillingLifecycle(projectId).pipe(timeout(this.modalRequestTimeoutMs)).subscribe(
      (res) => {
        this.billingLifecycle = res.summary;
        this.billingSummaryRowsData = this.buildBillingSummaryRows(res.summary);
        this.billingEvents = (res.events || []).slice(0, 10);
        this.billingLoading = false;
      },
      (err) => {
        this.billingMessage = 'Erro: ' + (err.name === 'TimeoutError' ? 'Tempo esgotado ao carregar cobrança' : (err.error?.error || 'Falha ao carregar cobrança'));
        this.billingLoading = false;
      }
    );
  }

  applyBillingAction(action: string) {
    if (!this.selectedProject || this.billingActionLoading) return;
    this.billingActionLoading = true;
    this.billingMessage = 'Aplicando...';
    this.adminService.applyProjectBillingAction(this.selectedProject._id, action, this.billingReason).subscribe(
      () => {
        this.billingActionLoading = false;
        this.loadProjects();
        this.closeModals();
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
    if (!dryRun && !window.confirm('Executar a cobrança automática agora? Isso pode suspender projetos, enviar avisos e aplicar downgrade para Free.')) {
      return;
    }
    this.billingJobLoading = true;
    this.billingJobMessage = dryRun ? 'Simulando cobrança automática...' : 'Executando cobrança automática...';
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
        this.billingJobMessage = 'Erro: ' + (err.error?.error || 'Falha ao executar cobrança automática');
        this.billingJobLoading = false;
      }
    );
  }

  billingStatusLabel(status: string): string {
    const labels: any = {
      free: 'Free',
      trialing: 'Teste',
      pending_authorization: 'Pendente',
      active: 'Ativo',
      grace_period: 'Carência',
      past_due: 'Atrasado',
      suspended: 'Suspenso',
      canceled: 'Cancelado'
    };
    return labels[status] || status || 'N/D';
  }

  planTypeLabel(type: string): string {
    const labels: any = {
      payment: 'Pago',
      free: 'Grátis'
    };
    return labels[type] || type || 'N/D';
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

  buildUsageSnapshotRows(snapshot: any): any[] {
    if (!snapshot) return [];
    return [
      { label: 'Contatos', value: this.usageValue(snapshot.contacts) },
      { label: 'Novos contatos no período', value: snapshot.contacts?.newInPeriod || 0 },
      { label: 'Membros', value: this.usageValue(snapshot.members) },
      { label: 'Plataformas', value: this.usageValue(snapshot.platforms) },
      { label: 'Conversas no período', value: snapshot.conversations?.current || 0 },
      { label: 'Mensagens no período', value: snapshot.messages?.total || 0 },
      { label: 'Tokens IA', value: this.usageValue(snapshot.tokens) },
      { label: 'E-mail', value: this.usageValue(snapshot.email) },
      { label: 'Anexos referenciados', value: snapshot.attachments?.count || 0 },
      { label: 'Storage medido', value: this.formatBytes(snapshot.attachments?.bytes) },
      { label: 'Downloads/previews de mídia', value: snapshot.mediaTraffic?.requests || 0 },
      { label: 'Tráfego de mídia', value: this.formatBytes(snapshot.mediaTraffic?.bytes) },
      { label: 'Custo estimado mensal', value: (snapshot.costEstimate?.currency || 'USD') + ' ' + (snapshot.costEstimate?.estimatedCostMonthly || 0) }
    ];
  }

  buildBillingSummaryRows(lifecycle: any): any[] {
    if (!lifecycle) return [];
    return [
      { label: 'Status', value: this.billingStatusLabel(lifecycle.status) },
      { label: 'Plano', value: lifecycle.planDisplayName || lifecycle.plan },
      { label: 'Tipo', value: lifecycle.type },
      { label: 'Período', value: lifecycle.billingPeriod || 'N/D' },
      { label: 'Fim do período', value: lifecycle.subEnd ? this.formatDateTime(lifecycle.subEnd) : 'N/D' },
      { label: 'Acesso até', value: lifecycle.accessEndsAt ? this.formatDateTime(lifecycle.accessEndsAt) : 'N/D' },
      { label: 'Falhas de pagamento', value: lifecycle.paymentFailureCount || 0 },
      { label: 'Motivo', value: lifecycle.billingStatusReason || 'N/D' },
      { label: 'Pode usar recursos pagos', value: lifecycle.canUsePaidFeatures ? 'Sim' : 'Não' }
    ];
  }

  formatDateTime(value: string): string {
    return value ? new Date(value).toLocaleString('pt-BR') : 'N/D';
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
      audio: 'Áudio',
      video: 'Vídeo',
      contact: 'Contato',
      location: 'Localização',
      sticker: 'Figurinha',
      poll: 'Enquete',
      event: 'Evento',
      unknown: 'Não identificado'
    };
    return labels[key] || key;
  }

  closeModals() {
    this.cancelProjectModalRequests();
    this.dialog.closeAll();
    this.showPlanModal = false;
    this.showTrialModal = false;
    this.showQuotasModal = false;
    this.showUsageModal = false;
    this.showBillingModal = false;
    this.selectedProject = null;
    this.modalMessage = '';
    this.usageSnapshot = null;
    this.usageSnapshots = [];
    this.usageSnapshotRowsData = [];
    this.usageChannelRows = [];
    this.usageTypeRows = [];
    this.usageLoading = false;
    this.usageSnapshotLoading = false;
    this.usageError = '';
    this.usageSnapshotMessage = '';
    this.billingLifecycle = null;
    this.billingEvents = [];
    this.billingSummaryRowsData = [];
    this.billingLoading = false;
    this.billingReason = '';
    this.billingMessage = '';
    this.billingActionLoading = false;
  }
}
