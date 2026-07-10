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
});
