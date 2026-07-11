import { Component, ViewEncapsulation } from '@angular/core';

export type AdminTab = 'dashboard' | 'projects' | 'users' | 'payments' | 'operation' | 'audit' | 'privacy';

export interface AdminNavItem {
  id: AdminTab;
  label: string;
  route: string;
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', route: 'dashboard' },
  { id: 'projects', label: 'Projetos', route: 'projects' },
  { id: 'users', label: 'Usuários', route: 'users' },
  { id: 'payments', label: 'Pagamentos', route: 'payments' },
  { id: 'operation', label: 'Operação', route: 'operation' },
  { id: 'audit', label: 'Auditoria', route: 'audit' },
];

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdminPanelComponent {
  readonly navItems = ADMIN_NAV_ITEMS;
  activeTab: AdminTab = 'dashboard';

  setActiveTab(tab: AdminTab): void {
    this.activeTab = tab;
  }

  onNavActiveChange(tab: AdminTab, isActive: boolean): void {
    if (isActive) this.activeTab = tab;
  }
}
