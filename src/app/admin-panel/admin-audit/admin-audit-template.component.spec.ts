import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AdminService } from '../../services/admin.service';
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

describe('AdminAuditComponent template', () => {
  let adminService: jasmine.SpyObj<AdminService>;

  beforeEach(async () => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', ['getAuditSummary', 'getAuditEvents']);
    adminService.getAuditSummary.and.returnValue(of({ total: 1, failures: 0, byAction: [], byActor: [] }));
    adminService.getAuditEvents.and.returnValue(of({ data: [currentEvent], count: 1 }));

    await TestBed.configureTestingModule({
      declarations: [AdminAuditComponent],
      imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatTableModule,
        NoopAnimationsModule
      ],
      providers: [{ provide: AdminService, useValue: adminService }]
    }).compileComponents();
  });

  it('abre detalhes por um botão semântico focável', () => {
    const fixture = TestBed.createComponent(AdminAuditComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.audit-detail-trigger') as HTMLButtonElement;

    expect(button).not.toBeNull();
    if (!button) return;
    expect(button.type).toBe('button');
    expect(button.tabIndex).toBe(0);
    button.focus();
    expect(document.activeElement).toBe(button);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedEvent).toBe(currentEvent);
    expect(fixture.nativeElement.querySelector('.audit-detail')).not.toBeNull();

    fixture.componentInstance.clearSelection();
    fixture.detectChanges();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedEvent).toBe(currentEvent);
    expect(fixture.nativeElement.querySelector('.audit-detail')).not.toBeNull();
  });

  it('não exibe empty, tabela ou paginador no erro inicial', () => {
    adminService.getAuditEvents.and.returnValue(throwError(new Error('unavailable')));
    const fixture = TestBed.createComponent(AdminAuditComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    expect(root.querySelector('table')).toBeNull();
    expect(root.querySelector('mat-paginator')).toBeNull();
    expect(root.querySelector('.admin-empty-state')).toBeNull();
  });

  it('mantém tabela e paginador dentro do wrapper auditável de largura útil', () => {
    const fixture = TestBed.createComponent(AdminAuditComponent);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.audit-table-wrap') as HTMLElement;
    const table = fixture.nativeElement.querySelector('.audit-table') as HTMLTableElement;
    const paginator = fixture.nativeElement.querySelector('mat-paginator') as HTMLElement;
    const summaryCell = fixture.nativeElement.querySelector('.audit-summary-cell') as HTMLElement;

    expect(wrapper).not.toBeNull();
    expect(table.parentElement).toBe(wrapper);
    expect(paginator.parentElement).toBe(fixture.nativeElement.querySelector('.audit-layout'));
    expect(wrapper.classList.contains('audit-table-wrap')).toBe(true);
    expect(getComputedStyle(wrapper).maxWidth).toBe('100%');
    expect(getComputedStyle(wrapper).minWidth).toBe('0px');
    expect(getComputedStyle(wrapper).overflowX).toBe('auto');
    expect(getComputedStyle(wrapper).overflowY).toBe('hidden');
    expect(getComputedStyle(table).minWidth).toBe('1080px');
    expect(getComputedStyle(summaryCell).whiteSpace).toBe('normal');
  });

  it('mantém os selects da auditoria no painel azul do admin', () => {
    const fixture = TestBed.createComponent(AdminAuditComponent);
    fixture.detectChanges();
    const selects = fixture.debugElement.queryAll(By.directive(MatSelect));

    expect(selects.length).toBe(4);
    for (const select of selects) {
      expect((select.componentInstance as MatSelect).panelClass).toBe('admin-select-panel');
    }
  });
});
