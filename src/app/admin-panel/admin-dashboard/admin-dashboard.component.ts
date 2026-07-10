import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import type {
  AlertStatus,
  HealthSummaryV2,
  OperationalCause,
  OperationalProduct,
  OperationalSnapshotItem,
  OperationalStatus,
  SnapshotState
} from '../../services/admin.service';

export interface OperationLinkFilters {
  tab?: 'channels' | 'alerts';
  product?: OperationalProduct;
  channel?: string;
  status?: OperationalStatus | AlertStatus;
  cause?: OperationalCause['cause'];
}

type AlertOperationLinkFilters = Pick<OperationLinkFilters, 'product' | 'channel' | 'cause'>;

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  summary: HealthSummaryV2 = null;
  isLoading = true;
  errorMessage = '';
  readonly products: OperationalProduct[] = ['casezap', 'waba'];
  readonly statuses: OperationalStatus[] = ['ok', 'degraded', 'down', 'unknown'];
  readonly productLabels: Record<OperationalProduct, string> = {
    casezap: 'CaseZap',
    waba: 'WABA',
    unknown: 'Desconhecido'
  };

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.summary = null;
    this.adminService.getOperationalHealthSummary().subscribe(
      (data) => {
        this.summary = data;
        this.isLoading = false;
      },
      () => {
        this.errorMessage = 'Erro ao carregar o resumo operacional.';
        this.isLoading = false;
      }
    );
  }

  retry(): void {
    this.load();
  }

  getProductStatusCount(product: OperationalProduct, status: OperationalStatus): number {
    return this.summary?.channels?.byProduct?.[product]?.[status] || 0;
  }

  getProductCount(product: OperationalProduct): number {
    return this.statuses.reduce((total, status) => total + this.getProductStatusCount(product, status), 0);
  }

  getChannelCount(): number {
    return this.summary?.channels?.count || 0;
  }

  getStatusCount(scope: 'channels' | 'alerts', status: OperationalStatus): number {
    return this.summary?.[scope]?.byStatus?.[status] || 0;
  }

  getTopCauses(scope: 'channels' | 'alerts'): OperationalCause[] {
    return this.summary?.[scope]?.topCauses?.slice(0, 5) || [];
  }

  getSnapshotStateLabel(state: SnapshotState): string {
    if (state === 'fresh') return 'Snapshot atual';
    if (state === 'stale') return 'Snapshot desatualizado';
    return 'Snapshot ausente';
  }

  getSnapshotStateMessage(state: SnapshotState): string {
    if (state === 'fresh') return 'Dados dentro da validade.';
    if (state === 'stale') return 'O ultimo snapshot expirou; os dados podem estar desatualizados.';
    return 'Nenhum snapshot foi gerado ainda.';
  }

  getSnapshotStateClass(state: SnapshotState): string {
    if (state === 'fresh') return 'admin-status-success';
    if (state === 'stale') return 'admin-status-warning';
    return 'admin-status-muted';
  }

  getOperationalStatusLabel(status: OperationalStatus): string {
    if (status === 'ok') return 'Normal';
    if (status === 'degraded') return 'Atencao';
    if (status === 'down') return 'Indisponivel';
    return 'Sem diagnostico';
  }

  getOperationalStatusClass(status: OperationalStatus): string {
    if (status === 'ok') return 'admin-status-success';
    if (status === 'degraded') return 'admin-status-warning';
    if (status === 'down') return 'admin-status-danger';
    return 'admin-status-muted';
  }

  buildOperationLink(filters: OperationLinkFilters): string {
    const keys: Array<keyof OperationLinkFilters> = ['tab', 'product', 'channel', 'status', 'cause'];
    const query = keys
      .filter((key) => Boolean(filters[key]))
      .map((key) => key + '=' + encodeURIComponent(filters[key]))
      .join('&');

    return '../operation' + (query ? '?' + query : '');
  }

  buildAlertOperationLink(
    healthStatus: OperationalStatus,
    filters: AlertOperationLinkFilters = {}
  ): string {
    return this.buildOperationLink({
      tab: 'alerts',
      ...filters,
      status: healthStatus === 'ok' ? 'resolved' : 'open'
    });
  }

  resourceLink(resource: OperationalSnapshotItem): string {
    return this.buildOperationLink({
      status: resource.status,
      cause: resource.cause || undefined
    });
  }
}
