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
  'uazapi',
  'privacy'
].map((path) => ({ path, component: RoutePageComponent }));

function getNavLinks(root: HTMLElement): HTMLAnchorElement[] {
  return Array.from(root.querySelectorAll('.admin-nav > a')) as HTMLAnchorElement[];
}

function findNavLink(links: HTMLAnchorElement[], label: string): HTMLAnchorElement {
  return links.find((link) => link.textContent.trim() === label);
}

interface CssRuleContainer {
  readonly cssRules: CSSRuleList;
}

interface CssSelectorRule extends CSSRule {
  readonly selectorText: string;
}

function hasSelectorText(rule: CSSRule): rule is CssSelectorRule {
  return 'selectorText' in rule;
}

function getCssRules(container: CssRuleContainer): CSSRule[] {
  try {
    return Array.from(container.cssRules).flatMap((rule) => {
      if (hasSelectorText(rule)) return [rule];
      return 'cssRules' in rule ? getCssRules(rule as CSSRule & CssRuleContainer) : [rule];
    });
  } catch {
    return [];
  }
}

function getAdminStyleSelectors(): string[] {
  const styleSheetRules = Array.from(document.styleSheets)
    .map((styleSheet) => getCssRules(styleSheet))
    .filter((rules) =>
      rules.some((rule) => hasSelectorText(rule) && rule.selectorText.includes('.admin-container'))
  );

  return styleSheetRules.flatMap((rules) =>
    rules
      .filter(hasSelectorText)
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

  it('expõe a tab UAZAPI logo após Auditoria', () => {
    const fixture = TestBed.createComponent(AdminPanelComponent);
    const component = fixture.componentInstance;

    expect(component.navItems.map((item) => item.label)).toEqual([
      'Dashboard',
      'Projetos',
      'Usuários',
      'Pagamentos',
      'Operação',
      'Auditoria',
      'UAZAPI',
    ]);
    expect(component.navItems.map((item) => item.route)).toEqual([
      'dashboard',
      'projects',
      'users',
      'payments',
      'operation',
      'audit',
      'uazapi',
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
    expect(findNavLink(links, 'Privacidade')).toBeUndefined();
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
    const nav = fixture.nativeElement.querySelector('.admin-nav') as HTMLElement;
    expect(getComputedStyle(nav).overflowX).toBe('auto');
    expect(getComputedStyle(operationLink).fontSize).toBe('14px');
    expect(getComputedStyle(operationLink).height).toBe('48px');
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
    expect(selectors).toContain('.admin-dialog-panel thead tr');
    expect(selectors).toContain('.admin-dialog-panel th');
    expect(selectors).toContain('.admin-dialog-panel td');
    expect(selectors).toContain('.admin-dialog-panel tbody tr');
    expect(selectors).toContain('.admin-dialog-panel tbody tr:hover');
    expect(selectors).toContain('.admin-select-panel .mat-option:hover');
    expect(selectors).not.toContain('table');
    expect(selectors).not.toContain('thead tr');
    expect(selectors).not.toContain('th');
    expect(selectors).not.toContain('td');
    expect(selectors).not.toContain('tbody tr');
    expect(selectors).not.toContain('tbody tr:hover');
  });
});
