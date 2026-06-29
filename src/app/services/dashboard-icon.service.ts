import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class DashboardIconService {
  private materialIconObserver: MutationObserver | null = null;
  private pendingMaterialIconFrame: number | null = null;
  private registeredIcons = new Set<string>();

  private readonly materialIconAliases: { [name: string]: string } = {
    access_time: 'clock',
    account_balance: 'building-bank',
    add: 'plus',
    add_circle: 'circle-plus',
    arrow_back: 'arrow-left',
    attach_file: 'paperclip',
    block: 'ban',
    cached: 'refresh',
    calendar_today: 'calendar',
    chat: 'message',
    check: 'check',
    chevron_left: 'chevron-left',
    chevron_right: 'chevron-right',
    clear: 'x',
    close: 'x',
    code: 'code',
    content_paste: 'clipboard',
    copy: 'copy',
    dashboard: 'layout-grid',
    dashboard_customize: 'apps',
    date_range: 'calendar',
    delete: 'trash',
    delete_forever: 'trash',
    description: 'file-description',
    do_not_disturb_on: 'ban',
    done: 'check',
    done_all: 'checks',
    edit: 'pencil',
    email: 'mail',
    error: 'alert-triangle',
    expand_less: 'chevron-up',
    expand_more: 'chevron-down',
    file_copy: 'copy',
    file_download: 'download',
    flag: 'flag',
    file_upload: 'file-upload',
    forum: 'message-circle',
    group: 'users',
    help: 'help-circle',
    help_outline: 'help-circle',
    history: 'history',
    inbox: 'inbox',
    info: 'info-circle',
    keyboard_arrow_down: 'chevron-down',
    keyboard_arrow_left: 'chevron-left',
    keyboard_arrow_right: 'chevron-right',
    keyboard_arrow_up: 'chevron-up',
    lan: 'sitemap',
    language: 'language',
    lightbulb: 'bulb',
    link: 'link',
    local_fire_department: 'flame',
    local_offer: 'tag',
    logout: 'logout',
    more_vert: 'dots-vertical',
    notifications: 'bell',
    notifications_none: 'bell',
    offline_bolt: 'bolt',
    open_in_browser: 'external-link',
    open_in_new: 'external-link',
    person: 'user',
    play_arrow: 'player-play',
    published_with_changes: 'refresh-dot',
    quickreply: 'message-bolt',
    refresh: 'refresh',
    report_problem: 'alert-triangle',
    save_alt: 'download',
    school: 'school',
    search: 'search',
    send: 'send',
    settings: 'settings',
    supervisor_account: 'users',
    textsms: 'message',
    trending_up: 'chart-bar',
    unfold_more: 'selector',
    undo: 'arrow-back-up',
    upgrade: 'arrow-up',
    visibility: 'eye',
    visibility_off: 'eye-off',
    volume_down: 'volume',
    volume_up: 'volume',
    view_list: 'list',
    warning: 'alert-triangle',
    watch_later: 'clock'
  };

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) { }

  registerIcons(): void {
    this.addTablerIcon('td-activity', 'activity');
    this.addTablerIcon('td-address-book', 'address-book');
    this.addTablerIcon('td-apps', 'apps');
    this.addTablerIcon('td-book', 'book');
    this.addTablerIcon('td-bolt', 'bolt');
    this.addTablerIcon('td-brain', 'brain');
    this.addTablerIcon('td-brand-whatsapp', 'brand-whatsapp');
    this.addTablerIcon('td-brush', 'brush');
    this.addTablerIcon('td-building-bank', 'building-bank');
    this.addTablerIcon('td-chart-bar', 'chart-bar');
    this.addTablerIcon('td-chevron-left', 'chevron-left');
    this.addTablerIcon('td-chevron-right', 'chevron-right');
    this.addTablerIcon('td-clock', 'clock');
    this.addTablerIcon('td-clipboard-list', 'clipboard-list');
    this.addTablerIcon('td-code', 'code');
    this.addTablerIcon('td-file-text', 'file-text');
    this.addTablerIcon('td-git-branch', 'git-branch');
    this.addTablerIcon('td-history', 'history');
    this.addTablerIcon('td-home', 'home');
    this.addTablerIcon('td-mood-smile', 'mood-smile');
    this.addTablerIcon('td-language', 'language');
    this.addTablerIcon('td-layout-grid', 'layout-grid');
    this.addTablerIcon('td-lifebuoy', 'lifebuoy');
    this.addTablerIcon('td-mail', 'mail');
    this.addTablerIcon('td-message', 'message');
    this.addTablerIcon('td-message-bolt', 'message-bolt');
    this.addTablerIcon('td-plug-connected', 'plug-connected');
    this.addTablerIcon('td-robot', 'robot');
    this.addTablerIcon('td-school', 'school');
    this.addTablerIcon('td-settings', 'settings');
    this.addTablerIcon('td-settings-automation', 'settings-automation');
    this.addTablerIcon('td-shield-cog', 'shield-cog');
    this.addTablerIcon('td-sparkles', 'sparkles');
    this.addTablerIcon('td-speakerphone', 'speakerphone');
    this.addTablerIcon('td-stopwatch', 'stopwatch');
    this.addTablerIcon('td-tag', 'tag');
    this.addTablerIcon('td-template', 'template');
    this.addTablerIcon('td-tools', 'tools');
    this.addTablerIcon('td-users', 'users');
    this.addTablerIcon('td-webhook', 'webhook');
    this.addTablerIcon('td-world', 'world');

    Object.values(this.materialIconAliases).forEach(fileName => {
      this.addTablerIcon(`td-${fileName}`, fileName);
    });
  }

  startMaterialIconAdapter(): void {
    if (typeof document === 'undefined' || this.materialIconObserver) {
      return;
    }

    this.applyMaterialIconAliases(document);
    this.materialIconObserver = new MutationObserver(() => this.scheduleMaterialIconAliasApply());
    this.materialIconObserver.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  stopMaterialIconAdapter(): void {
    if (this.materialIconObserver) {
      this.materialIconObserver.disconnect();
      this.materialIconObserver = null;
    }

    if (this.pendingMaterialIconFrame !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.pendingMaterialIconFrame);
      this.pendingMaterialIconFrame = null;
    }
  }

  private addTablerIcon(name: string, fileName: string): void {
    if (this.registeredIcons.has(name)) {
      return;
    }

    this.registeredIcons.add(name);
    this.matIconRegistry.addSvgIcon(
      name,
      this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/icons/tabler/${fileName}.svg`)
    );
  }

  private scheduleMaterialIconAliasApply(): void {
    if (this.pendingMaterialIconFrame !== null) {
      return;
    }

    if (typeof requestAnimationFrame === 'function') {
      this.pendingMaterialIconFrame = requestAnimationFrame(() => {
        this.pendingMaterialIconFrame = null;
        this.applyMaterialIconAliases(document);
      });
      return;
    }

    this.pendingMaterialIconFrame = window.setTimeout(() => {
      this.pendingMaterialIconFrame = null;
      this.applyMaterialIconAliases(document);
    }, 0);
  }

  private applyMaterialIconAliases(root: ParentNode): void {
    const elements = root.querySelectorAll<HTMLElement>(
      '.material-icons, .material-icons-outlined, .material-symbols-outlined, mat-icon:not([svgicon])'
    );

    elements.forEach(element => {
      const ligature = (element.textContent || '').trim().replace(/\s+/g, '_');
      const fileName = this.materialIconAliases[ligature];

      if (!fileName) {
        return;
      }

      this.applyMaskedIcon(element, fileName);
    });
  }

  private applyMaskedIcon(element: HTMLElement, fileName: string): void {
    if (element.dataset.tdTablerIcon === fileName) {
      return;
    }

    if (!element.dataset.tdIconSize) {
      const fontSize = window.getComputedStyle(element).fontSize;
      element.dataset.tdIconSize = fontSize && fontSize !== '0px' ? fontSize : '18px';
    }

    const size = element.dataset.tdIconSize;
    const iconUrl = `url("assets/icons/tabler/${fileName}.svg")`;

    element.dataset.tdTablerIcon = fileName;
    element.setAttribute('aria-hidden', 'true');
    element.style.setProperty('font-size', '0px', 'important');
    element.style.setProperty('display', 'inline-block', 'important');
    element.style.width = size;
    element.style.minWidth = size;
    element.style.height = size;
    element.style.verticalAlign = 'middle';
    element.style.backgroundColor = 'currentColor';
    element.style.maskImage = iconUrl;
    element.style.maskRepeat = 'no-repeat';
    element.style.maskPosition = 'center';
    element.style.maskSize = 'contain';
    element.style.setProperty('-webkit-mask-image', iconUrl);
    element.style.setProperty('-webkit-mask-repeat', 'no-repeat');
    element.style.setProperty('-webkit-mask-position', 'center');
    element.style.setProperty('-webkit-mask-size', 'contain');
  }
}
