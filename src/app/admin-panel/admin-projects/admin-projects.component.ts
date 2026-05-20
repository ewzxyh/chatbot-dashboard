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
  selectedProject: any = null;
  modalPlanKey = '';
  modalTrialDays = 14;
  modalQuotas: any = { contacts: 0, platforms: 0, agents: 0, chatbots: 0, kbs: 0 };
  modalMessage = '';
  usageSnapshot: any = null;
  usageLoading = false;
  usageError = '';
  planDisplayNames: any = { Free: 'Iniciante', Starter: 'Standard', Pro: 'Pro', Business: 'Enterprise', Custom: 'Custom' };

  constructor(private adminService: AdminService) { }
  ngOnInit() { this.loadProjects(); }

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
    this.usageError = '';
    this.usageLoading = true;
    this.showUsageModal = true;

    this.adminService.getProjectUsage(p._id, true).subscribe(
      (res) => { this.usageSnapshot = res; this.usageLoading = false; },
      (err) => {
        this.usageError = 'Erro: ' + (err.error?.error || 'Falha ao carregar uso');
        this.usageLoading = false;
      }
    );
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

  closeModals() {
    this.showPlanModal = false;
    this.showTrialModal = false;
    this.showQuotasModal = false;
    this.showUsageModal = false;
    this.selectedProject = null;
    this.modalMessage = '';
    this.usageSnapshot = null;
    this.usageError = '';
  }
}
