import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

interface AdminStats {
  totalProjects: number;
  totalUsers: number;
  monthlyRevenue: number;
  planDistribution: Record<string, number>;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats = null;
  isLoading = true;
  errorMessage = '';
  lastUpdated: Date = null;
  planDisplayNames: Record<string, string> = { free: 'Iniciante', starter: 'Standard', pro: 'Pro', business: 'Enterprise', custom: 'Custom', other: 'Outros' };

  constructor(private adminService: AdminService) { }

  ngOnInit() { this.loadStats(); }

  loadStats() {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getStats().subscribe(
      (data) => { this.stats = data; this.lastUpdated = new Date(); this.isLoading = false; },
      () => { this.errorMessage = 'Erro ao carregar estatísticas'; this.isLoading = false; }
    );
  }

  getPlanKeys(): string[] {
    if (!this.stats) return [];
    return Object.keys(this.stats.planDistribution);
  }

  getUsersPerProject(): number {
    if (!this.stats || !this.stats.totalProjects) return 0;
    return this.stats.totalUsers / this.stats.totalProjects;
  }

  getActivePlanCount(): number {
    return this.getPlanKeys().filter((key) => this.stats.planDistribution[key] > 0).length;
  }

  getPlanPercentage(key: string): number {
    if (!this.stats || !this.stats.totalProjects) return 0;
    return (this.stats.planDistribution[key] / this.stats.totalProjects) * 100;
  }

  getLargestPlanKey(): string {
    return this.getPlanKeys().reduce((largest, key) => {
      return this.stats.planDistribution[key] > (this.stats.planDistribution[largest] || 0) ? key : largest;
    }, '');
  }
}
