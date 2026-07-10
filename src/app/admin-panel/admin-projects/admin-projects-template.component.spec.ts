import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { AdminService } from '../../services/admin.service';
import { AdminProjectsComponent } from './admin-projects.component';

const project = {
  _id: 'project-1',
  name: 'Projeto',
  ownerEmail: 'redacted@example.invalid',
  createdAt: '2026-07-10T12:00:00.000Z',
  profile: {
    name: 'Pro',
    type: 'payment',
    billingStatus: 'active',
    agents: 5,
    quotes: { contacts: 100, platforms: 2, chatbots: 3, kbs: 4 }
  }
};

const usageSnapshot = {
  period: { start: '2026-07-01T00:00:00.000Z', end: '2026-07-10T23:59:59.999Z' },
  contacts: { current: 10, limit: 100, newInPeriod: 2 },
  members: { current: 5, limit: 10 },
  platforms: { current: 2, limit: 5 },
  messages: { total: 20, byChannel: { waba: 12 }, byType: { text: 20 } }
};

function findButton(root: ParentNode, label: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find((item) => item.textContent.trim() === label);
  if (!button) throw new Error(`Botão não encontrado: ${label}`);
  return button as HTMLButtonElement;
}

function openDialog(fixture: ComponentFixture<AdminProjectsComponent>, label: string): HTMLElement {
  findButton(fixture.nativeElement, label).click();
  fixture.detectChanges();
  const panel = document.body.querySelector('.admin-dialog-panel') as HTMLElement;
  if (!panel) throw new Error(`Dialog não abriu: ${label}`);
  return panel;
}

function expectDialogContract(panel: HTMLElement, title: string, width: string): void {
  expect(panel.style.width).toBe(width);
  expect(panel.style.maxWidth).toBe('calc(100vw - 32px)');
  expect(panel.querySelector('.admin-dialog-title').textContent).toContain(title);
}

describe('AdminProjectsComponent responsive contracts', () => {
  let adminService: jasmine.SpyObj<AdminService>;

  beforeEach(async () => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', [
      'getProjects',
      'getBillingLifecycleJobStatus',
      'updateProjectPlan',
      'extendTrial',
      'updateQuotas',
      'getProjectUsage',
      'getProjectUsageSnapshots',
      'saveProjectUsageSnapshot',
      'getProjectBillingLifecycle',
      'applyProjectBillingAction'
    ]);
    adminService.getProjects.and.returnValue(of({ data: [project], count: 1 }));
    adminService.getBillingLifecycleJobStatus.and.returnValue(of({}));
    adminService.updateProjectPlan.and.returnValue(of({}));
    adminService.extendTrial.and.returnValue(of({}));
    adminService.updateQuotas.and.returnValue(of({}));
    adminService.getProjectUsage.and.returnValue(of(usageSnapshot));
    adminService.getProjectUsageSnapshots.and.returnValue(of({ data: [] }));
    adminService.saveProjectUsageSnapshot.and.returnValue(of({}));
    adminService.getProjectBillingLifecycle.and.returnValue(of({
      summary: { status: 'active', plan: 'pro', type: 'payment' },
      events: []
    }));
    adminService.applyProjectBillingAction.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [AdminProjectsComponent],
      imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatTableModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AdminService, useValue: adminService },
        { provide: AuthService, useValue: jasmine.createSpyObj<AuthService>('AuthService', ['impersonate']) }
      ]
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  function createFixture(): ComponentFixture<AdminProjectsComponent> {
    const fixture = TestBed.createComponent(AdminProjectsComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('mantém a tabela principal no wrapper horizontal e os selects no painel azul', () => {
    const fixture = createFixture();
    const wrapper = fixture.nativeElement.querySelector('.admin-projects-table-wrap') as HTMLElement;
    const table = fixture.nativeElement.querySelector('.admin-table-wide') as HTMLTableElement;
    const selects = fixture.debugElement.queryAll(By.directive(MatSelect));

    expect(wrapper).not.toBeNull();
    expect(table.parentElement).toBe(wrapper);
    expect(selects.length).toBe(2);
    for (const select of selects) {
      expect((select.componentInstance as MatSelect).panelClass).toBe('admin-select-panel');
    }
  });

  it('abre Plano responsivo e preserva a troca de plano', () => {
    const fixture = createFixture();
    const panel = openDialog(fixture, 'Plano');

    expectDialogContract(panel, 'Alterar plano', '480px');
    expect(panel.querySelector('mat-select.admin-dialog-control')).not.toBeNull();
    expect(findButton(panel, 'Cancelar')).not.toBeNull();
    fixture.componentInstance.modalPlanKey = 'pro';
    fixture.detectChanges();
    findButton(panel, 'Salvar').click();

    expect(adminService.updateProjectPlan).toHaveBeenCalledWith(project._id, 'pro');
  });

  it('abre Teste responsivo e preserva a extensão do período', () => {
    const fixture = createFixture();
    const panel = openDialog(fixture, 'Teste');

    expectDialogContract(panel, 'Estender teste', '480px');
    expect(panel.querySelector('input.admin-dialog-control[type="number"]')).not.toBeNull();
    expect(findButton(panel, 'Cancelar')).not.toBeNull();
    fixture.componentInstance.modalTrialDays = 30;
    fixture.detectChanges();
    findButton(panel, 'Salvar').click();

    expect(adminService.extendTrial).toHaveBeenCalledWith(project._id, 30);
  });

  it('abre Cotas responsivo e preserva a substituição de limites', () => {
    const fixture = createFixture();
    const panel = openDialog(fixture, 'Cotas');

    expectDialogContract(panel, 'Substituir cotas', '480px');
    expect(panel.querySelectorAll('input.admin-dialog-control[type="number"]').length).toBe(5);
    expect(findButton(panel, 'Cancelar')).not.toBeNull();
    findButton(panel, 'Salvar').click();

    expect(adminService.updateQuotas).toHaveBeenCalledWith(project._id, jasmine.objectContaining({
      contacts: 100,
      platforms: 2,
      agents: 5,
      chatbots: 3,
      kbs: 4
    }));
  });

  it('abre Uso responsivo com tabelas internas e preserva o snapshot', () => {
    const fixture = createFixture();
    const panel = openDialog(fixture, 'Uso');

    expectDialogContract(panel, 'Uso real', '900px');
    expect(adminService.getProjectUsage).toHaveBeenCalledWith(project._id, true);
    expect(adminService.getProjectUsageSnapshots).toHaveBeenCalledWith(project._id);
    expect(panel.querySelector('.admin-dialog-content-wide')).not.toBeNull();
    expect(panel.querySelectorAll('.admin-dialog-table-wrap').length).toBeGreaterThan(0);
    expect(findButton(panel, 'Exportar CSV')).not.toBeNull();
    expect(findButton(panel, 'Fechar')).not.toBeNull();
    findButton(panel, 'Salvar snapshot').click();

    expect(adminService.saveProjectUsageSnapshot).toHaveBeenCalledWith(project._id, true);
  });

  it('abre Cobrança responsivo e preserva as ações de lifecycle', () => {
    const fixture = createFixture();
    const panel = openDialog(fixture, 'Cobrança');

    expectDialogContract(panel, 'Cobrança', '820px');
    expect(adminService.getProjectBillingLifecycle).toHaveBeenCalledWith(project._id);
    expect(panel.querySelector('input.admin-dialog-control[type="text"]')).not.toBeNull();
    expect(panel.querySelectorAll('.admin-dialog-table-wrap').length).toBeGreaterThan(0);
    expect(findButton(panel, 'Marcar atraso')).not.toBeNull();
    expect(findButton(panel, 'Suspender')).not.toBeNull();
    expect(findButton(panel, 'Downgrade Free')).not.toBeNull();
    expect(findButton(panel, 'Fechar')).not.toBeNull();

    const actions = [
      ['Reativar', 'reactivate'],
      ['Marcar atraso', 'mark_past_due'],
      ['Suspender', 'suspend'],
      ['Downgrade Free', 'downgrade_to_free']
    ] as const;
    for (const [label, action] of actions) {
      const actionPanel = label === 'Reativar' ? panel : openDialog(fixture, 'Cobrança');
      findButton(actionPanel, label).click();
      expect(adminService.applyProjectBillingAction).toHaveBeenCalledWith(project._id, action, '');
    }
  });
});
