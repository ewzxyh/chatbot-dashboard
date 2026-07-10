import type { Params, ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import type {
  AdminService,
  ChannelDiagnostic,
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

  beforeEach(() => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', [
      'getOperationalChannels',
      'getOperationalAlerts'
    ]);
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

  it('carrega canais com filtros server-side e atualiza count/page/limit', () => {
    component.ngOnInit();

    expect(adminService.getOperationalChannels).toHaveBeenCalledWith({ page: 1, limit: 25 });
    expect(component.channelRows).toEqual(channels.data);
    expect(component.count).toBe(1);
    expect(component.filters.page).toBe(1);
    expect(component.filters.limit).toBe(25);
    expect(component.isLoading).toBe(false);
  });

  it('mantem filtros ao trocar pagina e nao envia navegacao interna ao backend', () => {
    queryParams.next({
      tab: 'channels',
      page: '1',
      limit: '25',
      product: 'casezap',
      status: 'down',
      resource: 'mongo',
      resourceType: 'service'
    });
    component.ngOnInit();
    adminService.getOperationalChannels.calls.reset();

    component.changePage(2);

    expect(adminService.getOperationalChannels).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      product: 'casezap',
      status: 'down'
    });
    expect(adminService.getOperationalChannels.calls.mostRecent().args[0]).not.toEqual(
      jasmine.objectContaining({ tab: 'channels', resource: 'mongo', resourceType: 'service' })
    );
  });

  it('traduz recurso de servico e fila apenas para filtros de alertas', () => {
    queryParams.next({ tab: 'alerts', resource: 'mongo', resourceType: 'service' });
    component.ngOnInit();
    expect(adminService.getOperationalAlerts).toHaveBeenCalledWith({
      page: 1,
      limit: 25,
      service: 'mongo'
    });

    adminService.getOperationalAlerts.calls.reset();
    queryParams.next({ tab: 'alerts', resource: 'jobs', resourceType: 'queue' });
    expect(adminService.getOperationalAlerts).toHaveBeenCalledWith({
      page: 1,
      limit: 25,
      queue: 'jobs'
    });
  });

  it('ignora resourceType ausente ou invalido com seguranca', () => {
    queryParams.next({ tab: 'alerts', resource: 'mongo' });
    component.ngOnInit();
    expect(adminService.getOperationalAlerts.calls.mostRecent().args[0]).toEqual({ page: 1, limit: 25 });

    adminService.getOperationalAlerts.calls.reset();
    queryParams.next({ tab: 'alerts', resource: 'mongo', resourceType: 'database' });
    expect(adminService.getOperationalAlerts.calls.mostRecent().args[0]).toEqual({ page: 1, limit: 25 });
  });

  it('remove status incompatível ao trocar de aba e sincroniza a URL sem reload', () => {
    component.ngOnInit();
    component.filters = { page: 3, limit: 25, status: 'down' };
    component.selectTab('alerts');

    expect(component.filters).toEqual({ page: 1, limit: 25 });
    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: { tab: 'alerts', page: 1, limit: 25 }
    }));
    expect(adminService.getOperationalAlerts).toHaveBeenCalled();
  });

  it('valida tab, status e paginacao do deep-link antes da carga inicial', () => {
    queryParams.next({ tab: 'other', page: '0', limit: '201', status: 'down', channel: 'telegram', cause: 'arbitrary' });
    component.ngOnInit();

    expect(component.tab).toBe('channels');
    expect(component.filters).toEqual({ page: 1, limit: 25 });
    expect(adminService.getOperationalChannels).toHaveBeenCalledWith({ page: 1, limit: 25 });
  });

  it('expõe loading, erro, retry e empty sem inventar linhas', () => {
    const response = new BehaviorSubject<PagedResponse<ChannelDiagnostic>>(null);
    adminService.getOperationalChannels.and.returnValue(response.asObservable());
    component.ngOnInit();
    expect(component.isLoading).toBe(true);

    response.error(new Error('unavailable'));
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toContain('Erro ao carregar');
    expect(component.channelRows).toEqual([]);

    adminService.getOperationalChannels.and.returnValue(of({ data: [], count: 0, page: 1, limit: 25 }));
    component.retry();
    expect(component.errorMessage).toBe('');
    expect(component.isEmpty).toBe(true);
  });
});
