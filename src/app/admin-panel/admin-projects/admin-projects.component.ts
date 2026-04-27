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
  selectedProject: any = null;
  modalPlanKey = '';
  modalTrialDays = 14;
  modalQuotas: any = { contacts: 0, platforms: 0, agents: 0, chatbots: 0, kbs: 0 };
  modalMessage = '';
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

  closeModals() { this.showPlanModal = false; this.showTrialModal = false; this.showQuotasModal = false; this.selectedProject = null; this.modalMessage = ''; }
}
