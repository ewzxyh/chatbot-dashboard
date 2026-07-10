import type { Params, ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import type {
  AdminService,
  ChannelDiagnostic,
  HealthSummaryV2,
  OperationalAlert,
  PagedResponse
} from '../../services/admin.service';
import { AdminOperationComponent } from './admin-operation.component';

describe('AdminOperationComponent', () => {
  let adminService: jasmine.SpyObj<AdminService>;
  let queryParams: BehaviorSubject<Params>;
  let router: jasmine.SpyObj<Router>;
  let component: AdminOperationComponent;

  const channels: PagedResponse<ChannelDiagnostic> = {
    data: [{
      id: 'channel-1',
      integrationId: 'integration-1',
      id_project: 'project-1',
      name: 'WABA principal',
      product: 'waba',
      channel: 'webhook',
      status: 'degraded',
      cause: 'provider_timeout',
      checkedAt: '2026-07-10T12:00:00.000Z'
    }],
    count: 1,
    page: 1,
    limit: 25
  };
  const alerts: PagedResponse<OperationalAlert> = {
    data: [{
      id: 'alert-1',
      key: 'service:mongo',
      type: 'service_health',
      product: null,
      severity: 'critical',
      status: 'open',
      cause: 'mongo_unavailable',
      service: 'mongo',
      firstAt: '2026-07-10T11:00:00.000Z',
      lastAt: '2026-07-10T12:00:00.000Z',
      resolvedAt: null,
      occurrences: 1
    }],
    count: 1,
    page: 1,
    limit: 25
  };
  const createSummary = (snapshotState: 'fresh' | 'stale' | 'missing' = 'fresh'): HealthSummaryV2 => ({
    version: 2,
    overallStatus: snapshotState === 'missing' ? 'unknown' : 'degraded',
    snapshotState,
    generatedAt: snapshotState === 'missing' ? null : '2026-07-10T12:00:00.000Z',
    expiresAt: snapshotState === 'missing' ? null : '2026-07-10T12:05:00.000Z',
    services: [],
    queues: [],
    channels: {
      count: 0,
      byStatus: { ok: 0, degraded: 0, down: 0, unknown: 0 },
      byProduct: {
        casezap: { ok: 0, degraded: 0, down: 0, unknown: 0 },
        waba: { ok: 0, degraded: 0, down: 0, unknown: 0 },
        unknown: { ok: 0, degraded: 0, down: 0, unknown: 0 }
      },
      topCauses: []
    },
    alerts: {
      count: 0,
      byStatus: { ok: 0, degraded: 0, down: 0, unknown: 0 },
      topCauses: []
    }
  });

  beforeEach(() => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', [
      'getOperationalHealthSummary',
      'getOperationalChannels',
      'getOperationalAlerts'
    ]);
    adminService.getOperationalHealthSummary.and.returnValue(of(createSummary()));
    adminService.getOperationalChannels.and.returnValue(of(channels));
    adminService.getOperationalAlerts.and.returnValue(of(alerts));
    queryParams = new BehaviorSubject<Params>({});
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));
    component = new AdminOperationComponent(
      adminService,
      { queryParams: queryParams.asObservable() } as ActivatedRoute,
      router
    );
  });

  it('carrega summary read-only e canais com count/page/limit', () => {
    component.ngOnInit();

    expect(adminService.getOperationalHealthSummary).toHaveBeenCalledTimes(1);
    expect(adminService.getOperationalChannels).toHaveBeenCalledWith({ page: 1, limit: 25 });
    expect(component.summary.snapshotState).toBe('fresh');
    expect(component.channelRows).toEqual(channels.data);
    expect(component.count).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('cancela resposta e erro antigos ao trocar pagina', () => {
    const first = new Subject<PagedResponse<ChannelDiagnostic>>();
    const second = new Subject<PagedResponse<ChannelDiagnostic>>();
    const pageTwo: PagedResponse<ChannelDiagnostic> = {
      ...channels,
      data: [{ ...channels.data[0], id: 'channel-2' }],
      page: 2
    };
    adminService.getOperationalChannels.and.returnValues(first.asObservable(), second.asObservable());

    component.ngOnInit();
    component.changePage(2);
    second.next(pageTwo);
    first.next(channels);
    first.error(new Error('stale error'));

    expect(component.filters.page).toBe(2);
    expect(component.channelRows[0].id).toBe('channel-2');
    expect(component.errorMessage).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('cancela resposta antiga ao trocar de canais para alertas', () => {
    const channelResponse = new Subject<PagedResponse<ChannelDiagnostic>>();
    const alertResponse = new Subject<PagedResponse<OperationalAlert>>();
    adminService.getOperationalChannels.and.returnValue(channelResponse.asObservable());
    adminService.getOperationalAlerts.and.returnValue(alertResponse.asObservable());

    component.ngOnInit();
    component.selectTab('alerts');
    alertResponse.next(alerts);
    channelResponse.next(channels);

    expect(component.tab).toBe('alerts');
    expect(component.alertRows).toEqual(alerts.data);
    expect(component.channelRows).toEqual([]);
  });

  it('faz teardown de query, detail e summary no destroy', () => {
    const channelResponse = new Subject<PagedResponse<ChannelDiagnostic>>();
    const summaryResponse = new Subject<HealthSummaryV2>();
    adminService.getOperationalChannels.and.returnValue(channelResponse.asObservable());
    adminService.getOperationalHealthSummary.and.returnValue(summaryResponse.asObservable());

    component.ngOnInit();
    component.ngOnDestroy();
    queryParams.next({ tab: 'alerts' });
    channelResponse.next(channels);
    summaryResponse.next(createSummary('stale'));

    expect(adminService.getOperationalAlerts).not.toHaveBeenCalled();
    expect(component.channelRows).toEqual([]);
    expect(component.summary).toBeNull();
  });

  it('mostra snapshot missing como contexto distinto do empty filtrado', () => {
    adminService.getOperationalHealthSummary.and.returnValue(of(createSummary('missing')));
    adminService.getOperationalChannels.and.returnValue(of({ data: [], count: 0, page: 1, limit: 25 }));

    component.ngOnInit();

    expect(component.isSnapshotMissing).toBe(true);
    expect(component.isDetailsEmpty).toBe(true);
    expect(component.isEmpty).toBe(false);
  });

  it('mantem detalhes disponiveis quando o snapshot esta stale', () => {
    adminService.getOperationalHealthSummary.and.returnValue(of(createSummary('stale')));

    component.ngOnInit();

    expect(component.isSnapshotStale).toBe(true);
    expect(component.channelRows).toEqual(channels.data);
  });

  it('mostra erro de summary e permite retry sem disparar probe', () => {
    adminService.getOperationalHealthSummary.and.returnValues(
      throwError(new Error('unavailable')),
      of(createSummary('stale'))
    );

    component.ngOnInit();
    expect(component.summaryErrorMessage).toContain('Erro ao carregar');

    component.retrySummary();
    expect(adminService.getOperationalHealthSummary).toHaveBeenCalledTimes(2);
    expect(component.summaryErrorMessage).toBe('');
    expect(component.summary.snapshotState).toBe('stale');
  });

  it('ignora callback de summary anterior depois do retry', () => {
    const first = new Subject<HealthSummaryV2>();
    const second = new Subject<HealthSummaryV2>();
    adminService.getOperationalHealthSummary.and.returnValues(first.asObservable(), second.asObservable());

    component.ngOnInit();
    component.retrySummary();
    second.next(createSummary('stale'));
    first.next(createSummary('missing'));

    expect(component.summary.snapshotState).toBe('stale');
  });

  it('traduz resource somente para service/queue de alertas e nunca vaza navegacao', () => {
    queryParams.next({ tab: 'alerts', resource: ' jobs ', resourceType: 'queue' });
    component.ngOnInit();

    expect(adminService.getOperationalAlerts).toHaveBeenCalledWith({ page: 1, limit: 25, queue: 'jobs' });
    expect(adminService.getOperationalAlerts.calls.mostRecent().args[0]).not.toEqual(
      jasmine.objectContaining({ tab: 'alerts', resource: 'jobs', resourceType: 'queue' })
    );
  });

  it('sanitiza todos os filtros incompativeis ao trocar aba', () => {
    queryParams.next({ tab: 'alerts', resource: 'jobs', resourceType: 'queue' });
    component.ngOnInit();
    component.filters = {
      page: 3,
      limit: 25,
      product: 'telegram' as never,
      channel: 'telegram',
      status: 'open',
      cause: 'arbitrary' as never,
      from: 'invalid',
      to: '2026-02-30'
    };
    adminService.getOperationalChannels.calls.reset();

    component.selectTab('channels');

    expect(component.filters).toEqual({ page: 1, limit: 25 });
    expect(component.resourceValue).toBe('');
    expect(adminService.getOperationalChannels).toHaveBeenCalledWith({ page: 1, limit: 25 });
  });

  it('canonicaliza query invalida preservando filtros e paginacao validos sem loop', () => {
    const canonical = {
      tab: 'alerts',
      page: 2,
      limit: 50,
      product: 'waba',
      channel: 'webhook',
      status: 'open',
      cause: 'provider_timeout',
      from: '2026-07-10T12:00:00.001Z',
      to: '2026-07-10',
      resource: 'jobs',
      resourceType: 'queue'
    };
    queryParams.next({
      ...canonical,
      page: '2',
      limit: '50',
      channel: ' webhook ',
      resource: ' jobs ',
      ignored: 'remove-me'
    });

    component.ngOnInit();

    expect(component.filters).toEqual({
      page: 2,
      limit: 50,
      product: 'waba',
      channel: 'webhook',
      status: 'open',
      cause: 'provider_timeout',
      from: '2026-07-10T12:00:00.001Z',
      to: '2026-07-10'
    });
    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: canonical,
      replaceUrl: true
    }));

    const navigationCount = router.navigate.calls.count();
    queryParams.next(canonical);
    expect(router.navigate.calls.count()).toBe(navigationCount);
  });

  it('mantem filtros ao trocar pagina e expoe loading/error/retry/empty', () => {
    queryParams.next({ tab: 'channels', product: 'casezap', status: 'down' });
    component.ngOnInit();
    adminService.getOperationalChannels.calls.reset();

    component.changePage(2);
    expect(adminService.getOperationalChannels).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      product: 'casezap',
      status: 'down'
    });

    adminService.getOperationalChannels.and.returnValue(throwError(new Error('unavailable')));
    component.retry();
    expect(component.errorMessage).toContain('Erro ao carregar');

    adminService.getOperationalChannels.and.returnValue(of({ data: [], count: 0, page: 2, limit: 25 }));
    component.retry();
    expect(component.errorMessage).toBe('');
    expect(component.isEmpty).toBe(true);
  });
});
