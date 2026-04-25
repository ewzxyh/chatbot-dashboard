import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';
import { FaqKbService } from '../services/faq-kb.service';
import { UsersService } from '../services/users.service';

interface ChecklistItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  completed: boolean;
  autoDetect: boolean;
}

@Component({
  selector: 'appdashboard-onboarding-checklist',
  templateUrl: './onboarding-checklist.component.html',
  styleUrls: ['./onboarding-checklist.component.scss']
})
export class OnboardingChecklistComponent implements OnInit, OnDestroy {

  items: ChecklistItem[] = [];
  isMinimized: boolean = false;
  isVisible: boolean = false;
  projectId: string = '';
  completedCount: number = 0;

  private subscription: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private faqKbService: FaqKbService,
    private usersService: UsersService
  ) { }

  ngOnInit() {
    this.subscription = this.auth.project_bs
      .pipe(filter(p => !!p))
      .subscribe((project) => {
        this.projectId = project._id;
        var createdAt = new Date(project.createdAt);
        var thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (createdAt < thirtyDaysAgo) {
          this.isVisible = false;
          return;
        }

        this.loadState();
        this.checkAutoDetectedItems(project);
        this.isVisible = !this.isDismissed() && !this.allCompleted();
      });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  private loadState() {
    var storageKey = 'checklist_' + this.projectId;
    var saved = localStorage.getItem(storageKey);
    var completedIds: string[] = saved ? (JSON.parse(saved).completed || []) : [];

    this.items = [
      { id: 'whatsapp', label: 'Conectar WhatsApp', route: '/project/' + this.projectId + '/integrations?name=whatsapp', icon: 'chat', completed: completedIds.indexOf('whatsapp') > -1, autoDetect: false },
      { id: 'flow', label: 'Criar primeiro fluxo', route: '/project/' + this.projectId + '/bots/my-chatbots/all', icon: 'account_tree', completed: false, autoDetect: true },
      { id: 'welcome', label: 'Personalizar boas-vindas', route: '/project/' + this.projectId + '/widget-set-up', icon: 'waving_hand', completed: completedIds.indexOf('welcome') > -1, autoDetect: false },
      { id: 'hours', label: 'Definir horário de atendimento', route: '/project/' + this.projectId + '/hours', icon: 'schedule', completed: false, autoDetect: true },
      { id: 'agent', label: 'Convidar um agente', route: '/project/' + this.projectId + '/users', icon: 'person_add', completed: false, autoDetect: true }
    ];

    this.updateCount();
  }

  private checkAutoDetectedItems(project: any) {
    var hoursItem = this.items.find(i => i.id === 'hours');
    if (hoursItem && project.activeOperatingHours) {
      hoursItem.completed = true;
    }

    this.faqKbService.getFaqKbByProjectId().subscribe(
      (bots: any[]) => {
        var flowItem = this.items.find(i => i.id === 'flow');
        if (flowItem && bots && bots.length > 0) {
          flowItem.completed = true;
          this.updateCount();
        }
      },
      (err) => {}
    );

    this.usersService.getProjectUsersByProjectId().subscribe(
      (users: any[]) => {
        var agentItem = this.items.find(i => i.id === 'agent');
        if (agentItem && users && users.length > 1) {
          agentItem.completed = true;
          this.updateCount();
        }
      },
      (err) => {}
    );

    this.updateCount();
  }

  private updateCount() {
    this.completedCount = this.items.filter(i => i.completed).length;
  }

  private saveState() {
    var storageKey = 'checklist_' + this.projectId;
    var completedIds = this.items.filter(i => i.completed && !i.autoDetect).map(i => i.id);
    localStorage.setItem(storageKey, JSON.stringify({ completed: completedIds }));
  }

  toggleItem(item: ChecklistItem) {
    if (item.autoDetect) return;
    item.completed = !item.completed;
    this.updateCount();
    this.saveState();
    if (this.allCompleted()) this.isVisible = false;
  }

  navigateTo(item: ChecklistItem) {
    this.router.navigateByUrl(item.route);
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  dismiss() {
    var storageKey = 'checklist_dismissed_' + this.projectId;
    localStorage.setItem(storageKey, 'true');
    this.isVisible = false;
  }

  private isDismissed(): boolean {
    var storageKey = 'checklist_dismissed_' + this.projectId;
    return localStorage.getItem(storageKey) === 'true';
  }

  private allCompleted(): boolean {
    return this.items.length > 0 && this.items.every(i => i.completed);
  }
}
