import type { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import type { AuthService } from '../core/auth.service';
import type { AppConfigService } from './app-config.service';
import type { LoggerService } from './logger/logger.service';
import {
  AdminService
} from './admin.service';
import type {
  AlertSeverity,
  AlertStatus,
  ChannelDiagnostic,
  OperationalAlert,
  OperationalAlertFilters,
  OperationalCauseCode,
  OperationalChannel,
  OperationalStatus,
  PagedResponse
} from './admin.service';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? (<Value>() => Value extends Right ? 1 : 2) extends
      (<Value>() => Value extends Left ? 1 : 2) ? true : false
    : false;
type Expect<Value extends true> = Value;

type ExpectedChannelDiagnostic = {
  id: string;
  integrationId: string;
  id_project: string;
  name: string;
  product: 'casezap' | 'waba';
  channel: OperationalChannel;
  status: OperationalStatus;
  cause: OperationalCauseCode | null;
  checkedAt: string | null;
};

type ExpectedOperationalAlert = {
  id: string;
  key: string;
  type: string;
  product: 'casezap' | 'waba' | 'unknown' | null;
  severity: AlertSeverity;
  status: AlertStatus;
  cause: OperationalCauseCode | null;
  title?: string;
  service?: string;
  queue?: string;
  channel?: string;
  id_project?: string;
  integrationId?: string;
  firstAt: string | null;
  lastAt: string | null;
  resolvedAt: string | null;
  occurrences: number;
};

type ChannelDiagnosticContractIsExact = Expect<Equal<ChannelDiagnostic, ExpectedChannelDiagnostic>>;
type OperationalAlertContractIsExact = Expect<Equal<OperationalAlert, ExpectedOperationalAlert>>;
type PagedResponseContractIsExact = Expect<Equal<
  PagedResponse<ChannelDiagnostic>,
  { data: ChannelDiagnostic[]; count: number; page: number; limit: number }
>>;

describe('AdminService operational endpoints', () => {
  let getSpy: jasmine.Spy;
  let service: AdminService;

  beforeEach(() => {
    getSpy = jasmine.createSpy('get').and.returnValue(of({ data: [], count: 0, page: 1, limit: 25 }));
    const httpClient = { get: getSpy } as unknown as HttpClient;
    const auth = {
      user_bs: new BehaviorSubject({ token: 'admin-token' })
    } as unknown as AuthService;
    const appConfig = {
      getConfig: () => ({ SERVER_BASE_URL: 'https://api.chatcase.test/' })
    } as unknown as AppConfigService;
    const logger = {
      log: jasmine.createSpy('log')
    } as unknown as LoggerService;

    service = new AdminService(auth, httpClient, appConfig, logger);
  });

  it('envia somente filtros allowlisted ao endpoint paginado de canais', () => {
    service.getOperationalChannels({
      page: 2,
      limit: 25,
      product: 'waba',
      channel: 'webhook',
      status: 'degraded',
      cause: 'upstream_timeout',
      from: '2026-07-10T10:00:00.000Z',
      to: '2026-07-10T12:00:00.000Z'
    }).subscribe();

    const [url, options] = getSpy.calls.mostRecent().args as [string, { params: HttpParams }];
    expect(url).toBe('https://api.chatcase.test/sadmin/health/channels');
    expect(options.params.get('page')).toBe('2');
    expect(options.params.get('status')).toBe('degraded');
    expect(options.params.get('cause')).toBe('upstream_timeout');
    expect(options.params.get('from')).toBe('2026-07-10T10:00:00.000Z');
  });

  it('envia filtros de alerta validos e preserva encoding sem vazar extras', () => {
    const filters: OperationalAlertFilters & {
      tab: string;
      resource: string;
      resourceType: string;
      token: string;
    } = {
      page: 3,
      limit: 10,
      product: 'waba',
      channel: 'webhook',
      status: 'open',
      cause: 'provider_timeout',
      severity: 'critical',
      type: 'channel_health',
      service: 'rabbitmq',
      queue: 'jobs',
      project_id: 'project A&B',
      from: '2026-07-10T10:00:00.000Z',
      to: '2026-07-10T12:00:00.000Z',
      tab: 'alerts',
      resource: 'jobs',
      resourceType: 'queue',
      token: 'must-not-leak'
    };

    service.getOperationalAlerts(filters).subscribe();

    const [url, options] = getSpy.calls.mostRecent().args as [string, { params: HttpParams }];
    expect(url).toBe('https://api.chatcase.test/sadmin/operational-alerts');
    expect(options.params.get('status')).toBe('open');
    expect(options.params.get('severity')).toBe('critical');
    expect(options.params.get('type')).toBe('channel_health');
    expect(options.params.get('service')).toBe('rabbitmq');
    expect(options.params.get('queue')).toBe('jobs');
    expect(options.params.get('project_id')).toBe('project A&B');
    expect(options.params.get('tab')).toBeNull();
    expect(options.params.get('resource')).toBeNull();
    expect(options.params.get('resourceType')).toBeNull();
    expect(options.params.get('token')).toBeNull();
    expect(options.params.toString()).toContain('project_id=project%20A%26B');
  });
});
