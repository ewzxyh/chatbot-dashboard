import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class DashboardIconService {

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) { }

  registerIcons(): void {
    this.addTablerIcon('td-activity', 'activity');
    this.addTablerIcon('td-address-book', 'address-book');
    this.addTablerIcon('td-bolt', 'bolt');
    this.addTablerIcon('td-brain', 'brain');
    this.addTablerIcon('td-brand-whatsapp', 'brand-whatsapp');
    this.addTablerIcon('td-chart-bar', 'chart-bar');
    this.addTablerIcon('td-chevron-left', 'chevron-left');
    this.addTablerIcon('td-chevron-right', 'chevron-right');
    this.addTablerIcon('td-clipboard-list', 'clipboard-list');
    this.addTablerIcon('td-git-branch', 'git-branch');
    this.addTablerIcon('td-history', 'history');
    this.addTablerIcon('td-home', 'home');
    this.addTablerIcon('td-layout-grid', 'layout-grid');
    this.addTablerIcon('td-lifebuoy', 'lifebuoy');
    this.addTablerIcon('td-message', 'message');
    this.addTablerIcon('td-robot', 'robot');
    this.addTablerIcon('td-school', 'school');
    this.addTablerIcon('td-settings', 'settings');
    this.addTablerIcon('td-settings-automation', 'settings-automation');
    this.addTablerIcon('td-shield-cog', 'shield-cog');
    this.addTablerIcon('td-template', 'template');
    this.addTablerIcon('td-webhook', 'webhook');
  }

  private addTablerIcon(name: string, fileName: string): void {
    this.matIconRegistry.addSvgIcon(
      name,
      this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/icons/tabler/${fileName}.svg`)
    );
  }
}
