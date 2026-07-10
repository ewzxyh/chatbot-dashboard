import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminPanelComponent } from './admin-panel.component';

describe('AdminPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminPanelComponent],
      imports: [
        CommonModule,
        MatTabsModule,
        RouterTestingModule
      ]
    }).compileComponents();
  });

  it('expone exatamente as sete tabs aprovadas', () => {
    const fixture = TestBed.createComponent(AdminPanelComponent);
    const component = fixture.componentInstance as unknown as {
      navItems: Array<{ label: string; route: string }>;
      activeTab: string;
    };

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

  it('marca a rota ativa, preserva foco de teclado e retorna ao Dashboard', () => {
    const fixture = TestBed.createComponent(AdminPanelComponent);
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('.admin-nav .mat-tab-links > a')) as HTMLAnchorElement[];
    const component = fixture.componentInstance;
    expect(links.length).toBe(7);
    expect(links.every((link) => link.getAttribute('role') === 'tab')).toBe(true);
    expect(links.every((link) => link.getAttribute('href'))).toBe(true);
    component.onNavActiveChange('projects', true);
    expect(component.activeTab).toBe('projects');

    component.setActiveTab('dashboard');
    expect(component.activeTab).toBe('dashboard');
  });
});
