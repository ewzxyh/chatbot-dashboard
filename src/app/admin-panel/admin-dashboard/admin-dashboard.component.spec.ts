import type { Router, UrlTree } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import type { AdminService, HealthSummaryV2 } from '../../services/admin.service';
import { ADMIN_OPERATION_ROUTE, AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let adminService: jasmine.SpyObj<AdminService>;
  let component: AdminDashboardComponent;
  let createUrlTreeSpy: jasmine.Spy;

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
    createUrlTreeSpy = jasmine.createSpy('createUrlTree').and.callFake((commands: unknown[], extras: {
      queryParams?: Record<string, string>;
    }) => {
      const query = new URLSearchParams(extras.queryParams || {}).toString();
      return {
        toString: () => String(commands[0]) + (query ? '?' + query : '')
      } as unknown as UrlTree;
    });
    const router = { createUrlTree: createUrlTreeSpy } as unknown as Router;
    component = new AdminDashboardComponent(adminService, router);
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
    expect(component.buildOperationLink({
      product: 'waba',
      channel: 'webhook',
      status: 'degraded',
      cause: 'upstream_timeout'
    }).toString()).toContain('product=waba&channel=webhook&status=degraded&cause=upstream_timeout');
  });

  it('usa a rota Angular absoluta e preserva a query string', () => {
    const queryParams = {
      tab: 'alerts' as const,
      product: 'waba' as const,
      channel: 'webhook',
      status: 'open' as const,
      cause: 'upstream_timeout' as const
    };
    const link = component.buildOperationLink(queryParams).toString();

    expect(ADMIN_OPERATION_ROUTE).toBe('/admin/operation');
    expect(link).toBe('/admin/operation?tab=alerts&product=waba&channel=webhook&status=open&cause=upstream_timeout');
    expect(link).not.toContain('../operation');
    expect(createUrlTreeSpy).toHaveBeenCalledWith([ADMIN_OPERATION_ROUTE], { queryParams });
  });

  it('usa status open e a aba de alertas para um alerta critico', () => {
    const link = component.buildAlertOperationLink('down', {
      product: 'waba',
      channel: 'webhook',
      cause: 'upstream_timeout'
    }).toString();

    expect(link).toContain('tab=alerts');
    expect(link).toContain('product=waba');
    expect(link).toContain('channel=webhook');
    expect(link).toContain('status=open');
    expect(link).toContain('cause=upstream_timeout');
    expect(link).not.toContain('status=down');
  });

  it('usa status resolved ao abrir alertas sem problema ativo', () => {
    expect(component.buildAlertOperationLink('ok').toString()).toContain('tab=alerts&status=resolved');
  });
});
