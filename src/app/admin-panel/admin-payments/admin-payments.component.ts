import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { formatAdminText } from '../admin-text.util';

@Component({
  selector: 'app-admin-payments',
  templateUrl: './admin-payments.component.html'
})
export class AdminPaymentsComponent implements OnInit {
  payments: any[] = [];
  displayedColumns = ['project', 'plan', 'amount', 'type', 'status', 'mandate', 'createdAt'];
  totalCount = 0;
  page = 0;
  limit = 10;
  isLoading = true;
  errorMessage = '';
  filterStatus = '';

  constructor(private adminService: AdminService) { }
  ngOnInit() { this.loadPayments(); }

  loadPayments() {
    this.isLoading = true;
    this.errorMessage = '';
    const filters: any = {};
    if (this.filterStatus) filters.status = this.filterStatus;
    this.adminService.getPayments(this.page, this.limit, filters).subscribe(
      (res) => { this.payments = res.data; this.totalCount = res.count; this.isLoading = false; },
      (err) => {
        console.error('[ADMIN-PAYMENTS] loadPayments error', err);
        this.errorMessage = 'Erro ao carregar pagamentos.';
        this.isLoading = false;
      }
    );
  }

  retry() { this.loadPayments(); }

  onFilterChange() { this.page = 0; this.loadPayments(); }
  onPageChange(event: any) { this.page = event.pageIndex; this.limit = event.pageSize; this.loadPayments(); }
  nextPage() { if ((this.page + 1) * this.limit < this.totalCount) { this.page++; this.loadPayments(); } }
  prevPage() { if (this.page > 0) { this.page--; this.loadPayments(); } }
  displayText(value: any): string { return formatAdminText(value); }
  statusLabel(status: string): string {
    const labels: any = {
      created: 'Criado',
      AUTHORIZED: 'Autorizado',
      active: 'Ativo',
      canceled: 'Cancelado'
    };
    return labels[status] || status || 'N/D';
  }
}
