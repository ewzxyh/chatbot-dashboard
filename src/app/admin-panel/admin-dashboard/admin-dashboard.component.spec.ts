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
      { name: 'mongo', status: 'down', cause: 'connection_failed', checkedAt: '2026-07-10T11:59:58.000Z' }
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
        { cause: 'provider_auth_failed', count: 1 }
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
    component.summary.channels.topCauses = Array.from({ length: 6 }, (_, index) => ({
      cause: 'cause_' + index,
      count: index + 1
    }));

    expect(component.getTopCauses('channels').length).toBe(5);
  });

  it('explica os estados fresh, stale e missing do snapshot', () => {
    expect(component.getSnapshotStateLabel('fresh')).toBe('Snapshot atual');
    expect(component.getSnapshotStateLabel('stale')).toBe('Snapshot desatualizado');
    expect(component.getSnapshotStateLabel('missing')).toBe('Snapshot ausente');
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
    })).toContain('product=waba&channel=webhook&status=degraded&cause=upstream_timeout');
  });
});
