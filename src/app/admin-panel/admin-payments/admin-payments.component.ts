import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-payments',
  templateUrl: './admin-payments.component.html'
})
export class AdminPaymentsComponent implements OnInit {
  payments: any[] = [];
  totalCount = 0;
  page = 0;
  limit = 20;
  isLoading = true;
  filterStatus = '';

  constructor(private adminService: AdminService) { }
  ngOnInit() { this.loadPayments(); }

  loadPayments() {
    this.isLoading = true;
    const filters: any = {};
    if (this.filterStatus) filters.status = this.filterStatus;
    this.adminService.getPayments(this.page, this.limit, filters).subscribe(
      (res) => { this.payments = res.data; this.totalCount = res.count; this.isLoading = false; },
      (err) => { console.error('[ADMIN-PAYMENTS] loadPayments error', err); this.isLoading = false; }
    );
  }

  onFilterChange() { this.page = 0; this.loadPayments(); }
  nextPage() { if ((this.page + 1) * this.limit < this.totalCount) { this.page++; this.loadPayments(); } }
  prevPage() { if (this.page > 0) { this.page--; this.loadPayments(); } }
}
