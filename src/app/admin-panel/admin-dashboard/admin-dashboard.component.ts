import { Component, OnInit } from '@angular/core';
import type { Params } from '@angular/router';
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
  resource?: string;
  resourceType?: 'service' | 'queue';
}

type AlertOperationLinkFilters = Pick<OperationLinkFilters, 'product' | 'channel' | 'cause'>;
export const ADMIN_OPERATION_ROUTE = '/admin/operation';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  readonly operationRoute = ADMIN_OPERATION_ROUTE;
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

  buildOperationQueryParams(filters: OperationLinkFilters): Params {
    const keys: Array<keyof OperationLinkFilters> = ['tab', 'product', 'channel', 'status', 'cause', 'resource', 'resourceType'];
    const queryParams: Params = {};
    for (const key of keys) {
      const value = filters[key];
      if (value) queryParams[key] = value;
    }

    return queryParams;
  }

  buildAlertOperationQueryParams(
    healthStatus: OperationalStatus,
    filters: AlertOperationLinkFilters = {}
  ): Params {
    return this.buildOperationQueryParams({
      tab: 'alerts',
      ...filters,
      status: healthStatus === 'ok' ? 'resolved' : 'open'
    });
  }

  isResourceActionable(resource: OperationalSnapshotItem): boolean {
    return Boolean(resource && (resource.status !== 'ok' || resource.cause));
  }

  buildResourceOperationQueryParams(
    resource: OperationalSnapshotItem,
    resourceType: 'service' | 'queue'
  ): Params | null {
    if (!this.isResourceActionable(resource)) return null;
    return this.buildOperationQueryParams({
      tab: 'alerts',
      status: 'open',
      cause: resource.cause || undefined,
      resource: resource.name,
      resourceType
    });
  }
}
