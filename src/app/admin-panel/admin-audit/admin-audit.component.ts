import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-audit',
  templateUrl: './admin-audit.component.html',
  styleUrls: ['./admin-audit.component.scss']
})
export class AdminAuditComponent implements OnDestroy, OnInit {
  events: any[] = [];
  displayedColumns = ['timestamp', 'action', 'method', 'status', 'actor', 'project', 'entity', 'summary'];
  summary: any = null;
  selectedEvent: any = null;
  isLoading = false;
  isLoadingSummary = false;
  errorMessage = '';
  summaryErrorMessage = '';
  page = 0;
  limit = 10;
  totalCount = 0;
  private readonly destroy$ = new Subject<void>();
  private summarySubscription: Subscription = null;
  private eventsSubscription: Subscription = null;
  private summaryRequestId = 0;
  private eventsRequestId = 0;
  filters: any = {
    range: '24h',
    action: '',
    method: '',
    project_id: '',
    actor: '',
    entityType: '',
    success: '',
    search: ''
  };

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.refresh();
  }

  get isRefreshing(): boolean {
    return this.isLoading || this.isLoadingSummary;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelSummaryRequest();
    this.cancelEventsRequest();
  }

  refresh() {
    if (this.isRefreshing) return;
    this.loadSummary();
    this.loadEvents();
  }

  retry() { this.refresh(); }

  applyFilters() {
    this.page = 0;
    this.cancelSummaryRequest();
    this.cancelEventsRequest();
    this.refresh();
  }

  private cancelSummaryRequest() {
    this.summaryRequestId++;
    this.summarySubscription?.unsubscribe();
    this.summarySubscription = null;
    this.isLoadingSummary = false;
  }

  private cancelEventsRequest() {
    this.eventsRequestId++;
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
    this.isLoading = false;
  }

  loadSummary() {
    this.cancelSummaryRequest();
    const requestId = ++this.summaryRequestId;
    this.isLoadingSummary = true;
    this.summaryErrorMessage = '';
    this.summarySubscription = this.adminService.getAuditSummary({
      range: this.filters.range,
      project_id: this.filters.project_id
    }).pipe(takeUntil(this.destroy$)).subscribe(
      (res) => {
        if (requestId !== this.summaryRequestId) return;
        this.summary = res;
        this.isLoadingSummary = false;
      },
      () => {
        if (requestId !== this.summaryRequestId) return;
        this.summaryErrorMessage = 'Erro ao carregar o resumo da auditoria.';
        this.isLoadingSummary = false;
      }
    );
  }

  loadEvents() {
    this.cancelEventsRequest();
    const requestId = ++this.eventsRequestId;
    this.isLoading = true;
    this.errorMessage = '';
    const requestFilters = Object.assign({}, this.filters, {
      page: this.page,
      limit: this.limit
    });
    this.eventsSubscription = this.adminService.getAuditEvents(requestFilters).pipe(takeUntil(this.destroy$)).subscribe(
      (res) => {
        if (requestId !== this.eventsRequestId) return;
        this.events = res && res.data ? res.data : [];
        this.totalCount = res && res.count ? res.count : 0;
        if (this.selectedEvent) {
          const currentId = this.selectedEvent._id;
          this.selectedEvent = this.events.find((event) => event._id === currentId) || null;
        }
        this.isLoading = false;
      },
      () => {
        if (requestId !== this.eventsRequestId) return;
        this.errorMessage = 'Erro ao carregar auditoria';
        this.isLoading = false;
      }
    );
  }

  nextPage() {
    if ((this.page + 1) * this.limit < this.totalCount) {
      this.page++;
      this.loadEvents();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadEvents();
    }
  }

  onPageChange(event: any) {
    this.page = event.pageIndex;
    this.limit = event.pageSize;
    this.loadEvents();
  }

  selectEvent(event: any) {
    this.selectedEvent = event;
  }

  clearSelection() {
    this.selectedEvent = null;
  }

  formatAction(action: string): string {
    const labels: any = {
      'api.create': 'Criação',
      'api.update': 'Atualização',
      'api.delete': 'Exclusão',
      'api.read': 'Leitura',
      'admin.read': 'Leitura admin',
      'admin.project_plan_update': 'Plano',
      'admin.project_trial_update': 'Teste',
      'admin.project_quotas_update': 'Cotas',
      'admin.billing_lifecycle_action': 'Cobrança',
      'auth.write': 'Autenticação'
    };
    return labels[action] || action || '-';
  }

  statusLabel(event: any): string {
    if (!event) return '-';
    return (event.statusCode || '-') + (event.success === false ? ' falhou' : ' ok');
  }

  getTop(items: any[], limit: number): any[] {
    if (!items) return [];
    return items.slice(0, limit);
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
