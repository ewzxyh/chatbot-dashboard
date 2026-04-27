import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  isLoading = true;
  errorMessage = '';
  planDisplayNames: any = { free: 'Iniciante', starter: 'Standard', pro: 'Pro', business: 'Enterprise', custom: 'Custom', other: 'Outros' };

  constructor(private adminService: AdminService) { }

  ngOnInit() { this.loadStats(); }

  loadStats() {
    this.isLoading = true;
    this.adminService.getStats().subscribe(
      (data) => { this.stats = data; this.isLoading = false; },
      () => { this.errorMessage = 'Erro ao carregar estatisticas'; this.isLoading = false; }
    );
  }

  getPlanKeys(): string[] {
    if (!this.stats) return [];
    return Object.keys(this.stats.planDistribution);
  }
}
