import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { fakeAsync, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminPanelComponent } from './admin-panel.component';

@Component({ template: '<router-outlet></router-outlet>' })
class RouterHostComponent { }

@Component({ template: '' })
class RoutePageComponent { }

const childRoutes = [
  'dashboard',
  'projects',
  'users',
  'payments',
  'operation',
  'audit',
  'privacy'
].map((path) => ({ path, component: RoutePageComponent }));

function getNavLinks(root: HTMLElement): HTMLAnchorElement[] {
  return Array.from(root.querySelectorAll('.admin-nav > a')) as HTMLAnchorElement[];
}

function findNavLink(links: HTMLAnchorElement[], label: string): HTMLAnchorElement {
  return links.find((link) => link.textContent.trim() === label);
}

function getAdminStyleSelectors(): string[] {
  const styleSheets = Array.from(document.styleSheets).filter((styleSheet) =>
    Array.from(styleSheet.cssRules).some((rule) => rule instanceof CSSStyleRule && rule.selectorText.includes('.admin-container'))
  );

  return styleSheets.flatMap((styleSheet) =>
    Array.from(styleSheet.cssRules)
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .flatMap((rule) => rule.selectorText.split(',').map((selector) => selector.trim()))
  );
}

describe('AdminPanelComponent', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminPanelComponent, RouterHostComponent, RoutePageComponent],
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([{
          path: 'admin',
          component: AdminPanelComponent,
          children: childRoutes
        }])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('expõe exatamente as sete tabs aprovadas', () => {
    const fixture = TestBed.createComponent(AdminPanelComponent);
    const component = fixture.componentInstance;

    expect(component.navItems.map((item) => item.label)).toEqual([
      'Dashboard',
      'Projetos',
      'Usuários',
      'Pagamentos',
      'Operação',
      'Auditoria',
      'Privacidade'
    ]);
    expect(component.navItems.map((item) => item.route)).toEqual([
      'dashboard',
      'projects',
      'users',
      'payments',
      'operation',
      'audit',
      'privacy'
    ]);
  });

  it('retorna ao Dashboard pelo estado ativo', () => {
    const fixture = TestBed.createComponent(AdminPanelComponent);
    const component = fixture.componentInstance;

    component.onNavActiveChange('projects', true);
    expect(component.activeTab).toBe('projects');

    component.setActiveTab('dashboard');
    expect(component.activeTab).toBe('dashboard');
  });

  it('mantém somente Operação ativa quando a URL tem query params', fakeAsync(() => {
    const fixture = TestBed.createComponent(RouterHostComponent);
    fixture.detectChanges();

    router.navigateByUrl('/admin/operation?tab=alerts');
    tick();
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    const links = getNavLinks(fixture.nativeElement);
    const activeLinks = links.filter((link) => link.getAttribute('aria-current') === 'page');
    const dashboardLink = findNavLink(links, 'Dashboard');
    const operationLink = findNavLink(links, 'Operação');

    expect(links.length).toBe(7);
    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0]).toBe(operationLink);
    expect(dashboardLink.getAttribute('aria-current')).toBeNull();
  }));

  it('usa links nativos acessíveis sem setas Material', fakeAsync(() => {
    const fixture = TestBed.createComponent(RouterHostComponent);
    fixture.detectChanges();

    router.navigateByUrl('/admin/operation?tab=alerts');
    tick();
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    const links = getNavLinks(fixture.nativeElement);
    const operationLink = findNavLink(links, 'Operação');

    expect(operationLink.tabIndex).toBe(0);
    operationLink.focus();
    expect(document.activeElement).toBe(operationLink);
    expect(fixture.nativeElement.querySelector('[mat-tab-nav-bar]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.mat-tab-header-pagination-start')).toBeNull();
    expect(fixture.nativeElement.querySelector('.mat-tab-header-pagination-end')).toBeNull();
    flush();
  }));

  it('escopa estilos de tabela no admin e preserva o overlay fora do container', () => {
    const fixture = TestBed.createComponent(AdminPanelComponent);
    fixture.detectChanges();

    const selectors = getAdminStyleSelectors();
    expect(selectors).toContain('.admin-container table');
    expect(selectors).toContain('.admin-container thead tr');
    expect(selectors).toContain('.admin-container th');
    expect(selectors).toContain('.admin-container td');
    expect(selectors).toContain('.admin-container tbody tr');
    expect(selectors).toContain('.admin-container tbody tr:hover');
    expect(selectors).toContain('.admin-dialog-panel table');
    expect(selectors).toContain('.admin-select-panel .mat-option:hover');
    expect(selectors).not.toContain('table');
    expect(selectors).not.toContain('thead tr');
    expect(selectors).not.toContain('th');
    expect(selectors).not.toContain('td');
    expect(selectors).not.toContain('tbody tr');
    expect(selectors).not.toContain('tbody tr:hover');
  });
});
