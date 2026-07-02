import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class DashboardIconService {
  private materialIconObserver: MutationObserver | null = null;
  private pendingMaterialIconFrame: number | null = null;
  private pendingMaterialIconRoots = new Set<ParentNode>();
  private registeredIcons = new Set<string>();

  private readonly materialIconAliases: { [name: string]: string } = {
    access_time: 'clock',
    account_balance: 'building-bank',
    add: 'plus',
    add_circle: 'circle-plus',
    add_circle_outline: 'circle-plus',
    arrow_back: 'arrow-left',
    arrow_downward: 'chevron-down',
    arrow_drop_down: 'chevron-down',
    arrow_forward_ios: 'chevron-right',
    arrow_forward: 'arrow-right',
    arrow_upward: 'chevron-up',
    attach_file: 'paperclip',
    block: 'ban',
    bolt: 'bolt',
    apps: 'apps',
    archive: 'archive',
    bedtime: 'moon',
    cached: 'refresh',
    calendar_today: 'calendar',
    call: 'phone',
    camera_alt: 'camera',
    cancel: 'x',
    chat: 'message',
    chat_bubble: 'message',
    check: 'check',
    chevron_left: 'chevron-left',
    chevron_right: 'chevron-right',
    circle: 'circle',
    clear: 'x',
    cloud_download: 'download',
    cloud_upload: 'file-upload',
    close: 'x',
    code: 'code',
    computer: 'device-desktop',
    content_paste: 'clipboard',
    content_copy: 'copy',
    contact_page: 'address-book',
    contacts: 'address-book',
    construction: 'tools',
    copy: 'copy',
    dashboard: 'layout-grid',
    dashboard_customize: 'apps',
    data_usage: 'refresh-dot',
    date_range: 'calendar',
    delete: 'trash',
    delete_forever: 'trash',
    delete_outline: 'trash',
    description: 'file-description',
    diversity_3: 'users',
    do_not_disturb_on: 'ban',
    done: 'check',
    done_all: 'checks',
    emergency: 'alert-triangle',
    emoji_emotions: 'mood-smile',
    edit: 'pencil',
    email: 'mail',
    error: 'alert-triangle',
    error_outline: 'alert-triangle',
    event_repeat: 'refresh',
    expand_less: 'chevron-up',
    expand_more: 'chevron-down',
    exit_to_app: 'logout',
    fiber_manual_record: 'circle',
    file_copy: 'copy',
    file_download: 'download',
    flag: 'flag',
    file_upload: 'file-upload',
    format_list_bulleted_add: 'list',
    forward: 'arrow-right',
    forum: 'message-circle',
    generating_tokens: 'sparkles',
    grade: 'star',
    group: 'users',
    groups: 'users',
    help: 'help-circle',
    help_outline: 'help-circle',
    history: 'history',
    home: 'home',
    hourglass_empty: 'hourglass',
    inbox: 'inbox',
    info: 'info-circle',
    info_outline: 'info-circle',
    keyboard_backspace: 'arrow-left',
    keyboard_arrow_down: 'chevron-down',
    keyboard_arrow_left: 'chevron-left',
    keyboard_arrow_right: 'chevron-right',
    keyboard_arrow_up: 'chevron-up',
    lan: 'sitemap',
    language: 'language',
    launch: 'external-link',
    lightbulb: 'bulb',
    link: 'link',
    list_alt: 'list',
    local_fire_department: 'flame',
    local_offer: 'tag',
    lock_open: 'lock-open',
    logout: 'logout',
    manage_search: 'search',
    mail: 'mail',
    message: 'message',
    miscellaneous_services: 'tools',
    mode_edit: 'pencil',
    more_vert: 'dots-vertical',
    navigate_before: 'chevron-left',
    navigate_next: 'chevron-right',
    notifications: 'bell',
    notifications_none: 'bell',
    not_interested: 'ban',
    offline_bolt: 'bolt',
    open_in_browser: 'external-link',
    open_in_new: 'external-link',
    pause: 'player-pause',
    person: 'user',
    person_add: 'user-plus',
    person_off: 'ban',
    phone: 'phone',
    photo_camera: 'camera',
    pin_drop: 'map-pin',
    play_arrow: 'player-play',
    play_circle_filled: 'player-play',
    published_with_changes: 'refresh-dot',
    quickreply: 'message-bolt',
    refresh: 'refresh',
    remove: 'minus',
    report_problem: 'alert-triangle',
    save_alt: 'download',
    schedule: 'clock',
    school: 'school',
    search: 'search',
    send: 'send',
    settings: 'settings',
    smart_toy: 'robot',
    sms_failed: 'alert-triangle',
    speaker_notes: 'message',
    star: 'star',
    star_border: 'star',
    stop: 'player-stop',
    subject: 'file-text',
    supervisor_account: 'users',
    support: 'lifebuoy',
    swap_horiz: 'arrows-exchange',
    sync: 'refresh',
    textsms: 'message',
    trending_up: 'chart-bar',
    unfold_more: 'selector',
    undo: 'arrow-back-up',
    upgrade: 'arrow-up',
    visibility: 'eye',
    visibility_off: 'eye-off',
    volume_down: 'volume',
    volume_off: 'volume-off',
    volume_up: 'volume',
    view_list: 'list',
    warning: 'alert-triangle',
    watch_later: 'clock',
    webhook: 'webhook',
    wb_sunny: 'sun'
  };

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) { }

  registerIcons(): void {
    this.addTablerIcon('td-activity', 'activity');
    this.addTablerIcon('td-address-book', 'address-book');
    this.addTablerIcon('td-apps', 'apps');
    this.addTablerIcon('td-bell', 'bell');
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
    this.materialIconObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.pendingMaterialIconRoots.add(node as ParentNode);
          }
        });
      });

      if (this.pendingMaterialIconRoots.size) {
        this.scheduleMaterialIconAliasApply();
      }
    });
    this.materialIconObserver.observe(document.body, {
      childList: true,
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

    this.pendingMaterialIconRoots.clear();
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
        this.applyPendingMaterialIconAliases();
      });
      return;
    }

    this.pendingMaterialIconFrame = window.setTimeout(() => {
      this.pendingMaterialIconFrame = null;
      this.applyPendingMaterialIconAliases();
    }, 0);
  }

  private applyPendingMaterialIconAliases(): void {
    const roots = Array.from(this.pendingMaterialIconRoots);
    this.pendingMaterialIconRoots.clear();
    roots.forEach(root => this.applyMaterialIconAliases(root));
  }

  private applyMaterialIconAliases(root: ParentNode): void {
    const selector = '.material-icons, .material-icons-outlined, .material-icons-round, .material-icons-sharp, .material-icons-two-tone, .material-symbols-outlined, mat-icon:not([svgicon])';
    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));

    if (root instanceof HTMLElement && root.matches(selector)) {
      elements.unshift(root);
    }

    elements.forEach(element => {
      const ligature = (element.textContent || '').trim().replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
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
