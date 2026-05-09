import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-operation',
  templateUrl: './admin-operation.component.html',
  styleUrls: ['./admin-operation.component.scss']
})
export class AdminOperationComponent implements OnInit {
  summary: any = null;
  events: any[] = [];
  isLoading = true;
  isLoadingEvents = false;
  errorMessage = '';
  eventFilters: any = {
    channel: '',
    level: '',
    project_id: ''
  };

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.loadSummary();
    this.loadEvents();
  }

  loadSummary() {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getHealthSummary().subscribe(
      (data) => {
        this.summary = data;
        this.isLoading = false;
      },
      () => {
        this.errorMessage = 'Erro ao carregar status operacional';
        this.isLoading = false;
      }
    );
  }

  loadEvents() {
    this.isLoadingEvents = true;
    this.adminService.getOperationalEvents(this.eventFilters).subscribe(
      (result) => {
        this.events = result && result.data ? result.data : [];
        this.isLoadingEvents = false;
      },
      () => {
        this.events = [];
        this.isLoadingEvents = false;
      }
    );
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      ok: 'OK',
      degraded: 'Degradado',
      down: 'Indisponivel',
      unknown: 'Sem config',
      skipped: 'Ignorado',
      failed: 'Falhou',
      success: 'Sucesso'
    };
    return labels[status] || status || 'N/A';
  }

  getStatusClass(status: string): string {
    if (status === 'ok' || status === 'success') return 'status-ok';
    if (status === 'degraded' || status === 'warn' || status === 'skipped') return 'status-warn';
    if (status === 'down' || status === 'error' || status === 'failed') return 'status-error';
    return 'status-unknown';
  }

  formatDate(value: string): string {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString();
  }

  serviceDetail(service: any): string {
    if (!service || !service.details) return '';
    if (service.details.reason) return service.details.reason;
    if (service.details.error) return service.details.error;
    if (service.name === 'server') return 'uptime ' + service.details.uptimeSeconds + 's';
    if (service.latencyMs !== null && service.latencyMs !== undefined) return service.latencyMs + ' ms';
    return '';
  }
}
