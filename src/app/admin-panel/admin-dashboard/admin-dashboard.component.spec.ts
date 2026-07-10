import { readFileSync } from 'fs';
import { join } from 'path';
import { Subject, of, throwError } from 'rxjs';
import type { AdminService, HealthSummaryV2 } from '../../services/admin.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let adminService: jasmine.SpyObj<AdminService>;
  let component: AdminDashboardComponent;

  const createSummary = (snapshotState: 'fresh' | 'stale' | 'missing' = 'fresh'): HealthSummaryV2 => ({
    version: 2,
    overallStatus: 'degraded',
    snapshotState,
    generatedAt: '2026-07-10T12:00:00.000Z',
    expiresAt: '2026-07-10T12:05:00.000Z',
    services: [
      { name: 'server', status: 'ok', cause: null, checkedAt: '2026-07-10T11:59:58.000Z' },
      { name: 'mongo', status: 'down', cause: 'mongo_unavailable', checkedAt: '2026-07-10T11:59:58.000Z' }
    ],
    queues: [
      { name: 'messages', status: 'ok', cause: null, checkedAt: '2026-07-10T11:59:57.000Z' }
    ],
    channels: {
      count: 12,
      byStatus: { ok: 9, degraded: 2, down: 1, unknown: 0 },
      byProduct: {
        casezap: { ok: 5, degraded: 1, down: 0, unknown: 0 },
        waba: { ok: 4, degraded: 1, down: 1, unknown: 0 },
        unknown: { ok: 0, degraded: 0, down: 0, unknown: 0 }
      },
      topCauses: [
        { cause: 'upstream_timeout', count: 2 },
        { cause: 'provider_check_failed', count: 1 }
      ]
    },
    alerts: {
      count: 3,
      byStatus: { ok: 0, degraded: 2, down: 1, unknown: 0 },
      topCauses: [{ cause: 'upstream_timeout', count: 2 }]
    }
  });

  beforeEach(() => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', ['getOperationalHealthSummary']);
    component = new AdminDashboardComponent(adminService);
  });

  it('agrega CaseZap e WABA por status sem listar integracoes', () => {
    component.summary = createSummary();

    expect(component.getProductStatusCount('casezap', 'degraded')).toBe(1);
    expect(component.getProductStatusCount('waba', 'down')).toBe(1);
    expect(component.getChannelCount()).toBe(12);
  });

  it('mantem top causes bounded em cinco itens', () => {
    component.summary = createSummary();
    component.summary.channels.topCauses = [
      { cause: 'provider_timeout', count: 6 },
      { cause: 'upstream_timeout', count: 5 },
      { cause: 'provider_unreachable', count: 4 },
      { cause: 'webhook_failure', count: 3 },
      { cause: 'queue_backlog', count: 2 },
      { cause: 'storage_unavailable', count: 1 }
    ];
    component.summary.alerts.topCauses = component.summary.channels.topCauses;

    expect(component.getTopCauses('channels').length).toBe(5);
    expect(component.getTopCauses('alerts').length).toBe(5);
  });

  it('explica os estados fresh, stale e missing do snapshot', () => {
    expect(component.getSnapshotStateLabel('fresh')).toBe('Snapshot atual');
    expect(component.getSnapshotStateClass('fresh')).toBe('admin-status-success');
    expect(component.getSnapshotStateLabel('stale')).toBe('Snapshot desatualizado');
    expect(component.getSnapshotStateMessage('stale')).toContain('expirou');
    expect(component.getSnapshotStateClass('stale')).toBe('admin-status-warning');
    expect(component.getSnapshotStateLabel('missing')).toBe('Snapshot ausente');
    expect(component.getSnapshotStateMessage('missing')).toContain('Nenhum snapshot');
    expect(component.getSnapshotStateClass('missing')).toBe('admin-status-muted');
  });

  it('mantem loading ate o summary terminar e chama somente o summary', () => {
    const response = new Subject<ReturnType<typeof createSummary>>();
    adminService.getOperationalHealthSummary.and.returnValue(response.asObservable());

    component.load();

    expect(component.isLoading).toBe(true);
    expect(adminService.getOperationalHealthSummary).toHaveBeenCalledTimes(1);

    response.next(createSummary());
    response.complete();

    expect(component.isLoading).toBe(false);
    expect(component.summary.overallStatus).toBe('degraded');
  });

  it('mostra erro e permite retry do summary', () => {
    adminService.getOperationalHealthSummary.and.returnValue(throwError(new Error('unavailable')));

    component.load();

    expect(component.errorMessage).toBe('Erro ao carregar o resumo operacional.');
    expect(component.summary).toBeNull();
    expect(component.isLoading).toBe(false);

    adminService.getOperationalHealthSummary.and.returnValue(of(createSummary()));
    component.retry();

    expect(adminService.getOperationalHealthSummary).toHaveBeenCalledTimes(2);
    expect(component.errorMessage).toBe('');
    expect(component.summary.overallStatus).toBe('degraded');
  });

  it('mantem os quatro filtros no link para Operacao', () => {
    expect(component.buildOperationQueryParams({
      product: 'waba',
      channel: 'webhook',
      status: 'degraded',
      cause: 'upstream_timeout'
    })).toEqual({
      product: 'waba',
      channel: 'webhook',
      status: 'degraded',
      cause: 'upstream_timeout'
    });
  });

  it('mantem somente query params allowlisted para Operacao', () => {
    const queryParams = {
      tab: 'alerts' as const,
      product: 'waba' as const,
      channel: 'webhook',
      status: 'open' as const,
      cause: 'upstream_timeout' as const,
      resource: 'worker A&B'
    };
    const filters = Object.assign({ ignored: 'must-not-leak' }, queryParams);

    expect(component.buildOperationQueryParams(filters)).toEqual(queryParams);
  });

  it('usa status open e a aba de alertas para um alerta critico', () => {
    const queryParams = component.buildAlertOperationQueryParams('down', {
      product: 'waba',
      channel: 'webhook',
      cause: 'upstream_timeout'
    });

    expect(queryParams).toEqual({
      tab: 'alerts',
      product: 'waba',
      channel: 'webhook',
      status: 'open',
      cause: 'upstream_timeout'
    });
    expect(queryParams.status).not.toBe('down');
  });

  it('usa status resolved ao abrir alertas sem problema ativo', () => {
    expect(component.buildAlertOperationQueryParams('ok')).toEqual({ tab: 'alerts', status: 'resolved' });
  });

  it('abre servicos e filas como alertas ativos com recurso, tipo e causa validos', () => {
    expect(component.buildResourceOperationQueryParams({
      name: 'mongo',
      status: 'down',
      cause: 'mongo_unavailable',
      checkedAt: '2026-07-10T11:59:58.000Z'
    }, 'service')).toEqual({
      tab: 'alerts',
      status: 'open',
      cause: 'mongo_unavailable',
      resource: 'mongo',
      resourceType: 'service'
    });
    expect(component.buildResourceOperationQueryParams({
      name: 'messages',
      status: 'ok',
      cause: null,
      checkedAt: '2026-07-10T11:59:57.000Z'
    }, 'queue')).toEqual({
      tab: 'alerts',
      status: 'open',
      resource: 'messages',
      resourceType: 'queue'
    });
  });

  it('usa routerLink absoluto com queryParams sem UrlTree ou href no template', () => {
    const componentPath = join(process.cwd(), 'src/app/admin-panel/admin-dashboard');
    const template = readFileSync(join(componentPath, 'admin-dashboard.component.html'), 'utf8');
    const source = readFileSync(join(componentPath, 'admin-dashboard.component.ts'), 'utf8');
    const operationLinks = template.match(/<a\b[^>]*>/g) || [];

    expect(operationLinks.length).toBe(7);
    for (const link of operationLinks) {
      expect(link).toContain('routerLink="/admin/operation"');
      expect(link).toContain('[queryParams]');
    }
    expect(template).not.toContain('../operation');
    expect(template).not.toContain('href=');
    expect(source).not.toContain('UrlTree');
    expect(source).not.toContain('private router: Router');
  });
});
