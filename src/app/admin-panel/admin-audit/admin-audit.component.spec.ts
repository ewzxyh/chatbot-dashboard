import { of, Subject, throwError } from 'rxjs';
import type { AdminService } from '../../services/admin.service';
import { AdminAuditComponent } from './admin-audit.component';

const currentEvent = {
  _id: 'event-new',
  timestamp: '2026-07-10T12:00:00.000Z',
  action: 'admin.read',
  method: 'GET',
  success: true,
  statusCode: 200,
  summary: 'Evento atual'
};

describe('AdminAuditComponent requests', () => {
  let adminService: jasmine.SpyObj<AdminService>;
  let component: AdminAuditComponent;

  beforeEach(() => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', ['getAuditSummary', 'getAuditEvents']);
    adminService.getAuditSummary.and.returnValue(of({ total: 0, byAction: [], byActor: [] }));
    adminService.getAuditEvents.and.returnValue(of({ data: [], count: 0 }));
    component = new AdminAuditComponent(adminService);
  });

  it('ignora refresh e retry enquanto qualquer parte do refresh está pendente', () => {
    const summaryResponse = new Subject<any>();
    const eventsResponse = new Subject<any>();
    adminService.getAuditSummary.and.returnValue(summaryResponse.asObservable());
    adminService.getAuditEvents.and.returnValue(eventsResponse.asObservable());

    component.ngOnInit();
    component.refresh();
    component.retry();

    expect(adminService.getAuditSummary).toHaveBeenCalledTimes(1);
    expect(adminService.getAuditEvents).toHaveBeenCalledTimes(1);
    expect(component.isRefreshing).toBe(true);
  });

  it('cancela requests anteriores e não aceita callbacks fora de ordem', () => {
    const firstSummary = new Subject<any>();
    const secondSummary = new Subject<any>();
    const firstEvents = new Subject<any>();
    const secondEvents = new Subject<any>();
    adminService.getAuditSummary.and.returnValues(firstSummary.asObservable(), secondSummary.asObservable());
    adminService.getAuditEvents.and.returnValues(firstEvents.asObservable(), secondEvents.asObservable());

    component.ngOnInit();
    component.filters.search = 'atual';
    component.applyFilters();

    expect(firstSummary.observers.length).toBe(0);
    expect(firstEvents.observers.length).toBe(0);

    secondEvents.next({ data: [currentEvent], count: 1 });
    expect(component.events).toEqual([currentEvent]);
    expect(component.isRefreshing).toBe(true);

    firstEvents.next({ data: [{ ...currentEvent, _id: 'event-old' }], count: 1 });
    firstSummary.next({ total: 99, byAction: [], byActor: [] });
    expect(component.events).toEqual([currentEvent]);
    expect(component.summary).toBeNull();
    expect(component.isLoadingSummary).toBe(true);

    secondSummary.next({ total: 1, byAction: [], byActor: [] });
    expect(component.summary.total).toBe(1);
    expect(component.isRefreshing).toBe(false);
  });

  it('mantém dados anteriores quando o refresh atual falha', () => {
    component.events = [currentEvent];
    component.totalCount = 1;
    component.summary = { total: 1, byAction: [], byActor: [] };
    adminService.getAuditSummary.and.returnValue(throwError(new Error('summary unavailable')));
    adminService.getAuditEvents.and.returnValue(throwError(new Error('events unavailable')));

    component.refresh();

    expect(component.events).toEqual([currentEvent]);
    expect(component.totalCount).toBe(1);
    expect(component.summary.total).toBe(1);
    expect(component.errorMessage).toContain('Erro ao carregar');
    expect(component.summaryErrorMessage).toContain('Erro ao carregar');
  });

  it('faz teardown das requests pendentes', () => {
    const summaryResponse = new Subject<any>();
    const eventsResponse = new Subject<any>();
    adminService.getAuditSummary.and.returnValue(summaryResponse.asObservable());
    adminService.getAuditEvents.and.returnValue(eventsResponse.asObservable());

    component.ngOnInit();
    expect(summaryResponse.observers.length).toBe(1);
    expect(eventsResponse.observers.length).toBe(1);

    component.ngOnDestroy();
    expect(summaryResponse.observers.length).toBe(0);
    expect(eventsResponse.observers.length).toBe(0);
  });
});
