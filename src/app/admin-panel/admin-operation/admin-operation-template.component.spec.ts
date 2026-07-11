import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import type { ChannelDiagnostic, HealthSummaryV2, PagedResponse } from '../../services/admin.service';
import { AdminOperationComponent } from './admin-operation.component';

const summary: HealthSummaryV2 = {
  version: 2,
  overallStatus: 'degraded',
  snapshotState: 'fresh',
  generatedAt: '2026-07-10T12:00:00.000Z',
  expiresAt: '2026-07-10T12:05:00.000Z',
  services: [],
  queues: [],
  channels: {
    count: 1,
    byStatus: { ok: 1, degraded: 0, down: 0, unknown: 0 },
    byProduct: {
      casezap: { ok: 1, degraded: 0, down: 0, unknown: 0 },
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
};

const channels: PagedResponse<ChannelDiagnostic> = {
  data: [{
    id: 'channel-1',
    integrationId: 'integration-1',
    id_project: 'project-1',
    name: 'CaseZap principal',
    product: 'casezap',
    channel: 'casezap',
    status: 'ok',
    cause: null,
    checkedAt: '2026-07-10T12:00:00.000Z'
  }],
  count: 1,
  page: 1,
  limit: 25
};

describe('AdminOperationComponent template', () => {
  let adminService: jasmine.SpyObj<AdminService>;

  beforeEach(async () => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', [
      'getOperationalHealthSummary',
      'getOperationalChannels',
      'getOperationalAlerts',
      'getOperationalEvents',
      'getOperationalMetrics'
    ]);
    adminService.getOperationalHealthSummary.and.returnValue(of(summary));
    adminService.getOperationalChannels.and.returnValue(of(channels));
    adminService.getOperationalAlerts.and.returnValue(of({ data: [], count: 0, page: 1, limit: 25 }));
    adminService.getOperationalEvents.and.returnValue(of({ data: [] }));
    adminService.getOperationalMetrics.and.returnValue(of({
      generatedAt: null,
      events: { total: 0, byBucket: [], byEvent: {}, byLevel: {} },
      alerts: { total: 0, criticalOpenCount: 0, byBucket: [], byType: {} }
    }));

    await TestBed.configureTestingModule({
      declarations: [AdminOperationComponent],
      imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatTableModule,
        MatTabsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: AdminService, useValue: adminService },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) }
      ]
    }).compileComponents();
  });

  it('usa azul nas tabs, tipografia legível e overflow nativo nas tabelas', () => {
    const fixture = TestBed.createComponent(AdminOperationComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const inkBar = root.querySelector('.operation-tabs .mat-ink-bar') as HTMLElement;
    const tabLabel = root.querySelector('.operation-tabs .mat-tab-label') as HTMLElement;
    const tableScroll = root.querySelector('.table-scroll') as HTMLElement;
    const table = root.querySelector('.operation-table') as HTMLTableElement;
    const tableHeader = root.querySelector('.operation-table th') as HTMLElement;
    const tableCell = root.querySelector('.operation-table td') as HTMLElement;

    expect(getComputedStyle(inkBar).backgroundColor).toBe('rgb(30, 136, 229)');
    expect(getComputedStyle(tabLabel).fontSize).toBe('14px');
    expect(getComputedStyle(tableScroll).overflowX).toBe('auto');
    expect(getComputedStyle(table).minWidth).toBe('1120px');
    expect(getComputedStyle(tableHeader).fontSize).toBe('14px');
    expect(getComputedStyle(tableCell).fontSize).toBe('14px');
  });

  it('reutiliza o padrão de filtros do admin nas quatro áreas', () => {
    const fixture = TestBed.createComponent(AdminOperationComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const expectFilterBar = (label: string, fieldCount: number, dateCount: number): void => {
      const filterBar = root.querySelector(`[aria-label="${label}"]`) as HTMLElement;
      const fields = Array.from(filterBar.querySelectorAll('mat-form-field')) as HTMLElement[];

      expect(filterBar.classList.contains('admin-filter-bar')).toBe(true);
      expect(fields.length).toBe(fieldCount);
      expect(fields.every((field) => field.classList.contains('admin-filter-field'))).toBe(true);
      expect(filterBar.querySelectorAll('input[type="date"].mat-input-element').length).toBe(dateCount);
    };

    expectFilterBar('Filtros de canais', 6, 2);
    expect(root.querySelector('.operation-filters .mat-select-value-text')?.textContent.trim()).toBe('Todos');

    fixture.componentInstance.selectTabByIndex(1);
    fixture.detectChanges();
    expectFilterBar('Filtros de alertas', 6, 2);

    fixture.componentInstance.selectTabByIndex(3);
    fixture.detectChanges();
    expectFilterBar('Filtros de eventos', 4, 0);
    expectFilterBar('Filtros de metricas', 4, 0);
    expect(root.querySelector('.native-date-field')).toBeNull();
  });
});
