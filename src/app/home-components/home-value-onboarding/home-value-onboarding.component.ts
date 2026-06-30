import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IntegrationService } from 'app/services/integration.service';
import { WsRequestsService } from 'app/services/websocket/ws-requests.service';
import { AppConfigService } from 'app/services/app-config.service';

interface OnboardingStep {
  key: 'channel' | 'flow' | 'conversation';
  title: string;
  detail: string;
  action: string;
  done: boolean;
  enabled: boolean;
  icon: string;
}

@Component({
  selector: 'appdashboard-home-value-onboarding',
  templateUrl: './home-value-onboarding.component.html',
  styleUrls: ['./home-value-onboarding.component.scss']
})
export class HomeValueOnboardingComponent implements OnInit, OnChanges {
  @Input() projectId: string;
  @Input() chatbots: any[] = [];
  @Input() canManageChannels = true;
  @Input() canManageFlows = true;

  loadingChannels = false;
  loadingConversations = false;
  channelCount = 0;
  flowCount = 0;
  conversationCount = 0;
  steps: OnboardingStep[] = [];

  constructor(
    private router: Router,
    private integrationService: IntegrationService,
    private wsRequestsService: WsRequestsService,
    private appConfigService: AppConfigService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.chatbots) {
      this.flowCount = this.getFlowCount(this.chatbots);
      this.buildSteps();
    }
    if (changes.projectId && this.projectId) {
      this.refresh();
    }
  }

  refresh() {
    this.flowCount = this.getFlowCount(this.chatbots);
    this.buildSteps();
    if (!this.projectId) return;
    this.loadChannels();
    this.loadConversationCount();
  }

  get completedSteps(): number {
    return this.steps.filter(step => step.done).length;
  }

  get progressPercent(): number {
    if (!this.steps.length) return 0;
    return Math.round((this.completedSteps / this.steps.length) * 100);
  }

  runStep(step: OnboardingStep) {
    if (!step || !step.enabled) return;
    if (step.key === 'channel') {
      this.router.navigate(['project/' + this.projectId + '/integrations'], { queryParams: { name: 'casezap' } });
    }
    if (step.key === 'flow') {
      this.router.navigate(['project/' + this.projectId + '/bots/templates/all']);
    }
    if (step.key === 'conversation') {
      const chatBaseUrl = this.appConfigService.getConfig().CHAT_BASE_URL;
      if (chatBaseUrl) {
        window.open(chatBaseUrl + '#/conversation-detail/', '_self');
      } else {
        this.router.navigate(['project/' + this.projectId + '/chat']);
      }
    }
  }

  private loadChannels() {
    this.loadingChannels = true;
    forkJoin({
      casezap: this.integrationService.getIntegrationInstances('casezap', this.projectId).pipe(catchError(() => of([]))),
      whatsapp: this.integrationService.getIntegrationInstances('whatsapp', this.projectId).pipe(catchError(() => of([])))
    }).subscribe((res: any) => {
      const casezap = this.countActiveInstances(res.casezap);
      const whatsapp = this.countActiveInstances(res.whatsapp);
      this.channelCount = casezap + whatsapp;
      this.loadingChannels = false;
      this.buildSteps();
    }, () => {
      this.channelCount = 0;
      this.loadingChannels = false;
      this.buildSteps();
    });
  }

  private loadConversationCount() {
    this.loadingConversations = true;
    this.wsRequestsService.getConversationCount(this.projectId).subscribe((res: any) => {
      this.conversationCount = this.parseConversationCount(res);
      this.loadingConversations = false;
      this.buildSteps();
    }, () => {
      this.conversationCount = 0;
      this.loadingConversations = false;
      this.buildSteps();
    });
  }

  private buildSteps() {
    this.steps = [
      {
        key: 'channel',
        title: 'Canal conectado',
        detail: this.channelCount > 0 ? this.channelCount + ' plataforma(s) ativa(s)' : 'Conecte CaseZap ou WABA',
        action: this.channelCount > 0 ? 'Gerenciar' : 'Conectar',
        done: this.channelCount > 0,
        enabled: this.canManageChannels,
        icon: 'forum'
      },
      {
        key: 'flow',
        title: 'Fluxo inicial',
        detail: this.flowCount > 0 ? this.flowCount + ' fluxo(s) criado(s)' : 'Use um modelo pronto de WhatsApp',
        action: this.flowCount > 0 ? 'Ver fluxos' : 'Usar modelo',
        done: this.flowCount > 0,
        enabled: this.canManageFlows,
        icon: 'account_tree'
      },
      {
        key: 'conversation',
        title: 'Primeiro atendimento',
        detail: this.conversationCount > 0 ? this.conversationCount + ' conversa(s) em andamento' : 'Abra o chat para acompanhar as mensagens',
        action: 'Abrir chat',
        done: this.conversationCount > 0,
        enabled: true,
        icon: 'support_agent'
      }
    ];
  }

  private getFlowCount(chatbots: any[]): number {
    if (!Array.isArray(chatbots)) return 0;
    return chatbots.filter(bot => bot && bot.type !== 'identity').length;
  }

  private countActiveInstances(instances: any): number {
    if (!Array.isArray(instances)) return 0;
    return instances.filter(instance => {
      if (!instance) return false;
      if (instance.trashed === true) return false;
      if (instance.status === 'disabled') return false;
      return true;
    }).length;
  }

  private parseConversationCount(res: any): number {
    if (typeof res === 'number') return res;
    if (!res) return 0;
    if (typeof res.count === 'number') return res.count;
    return ['unassigned', 'assigned', 'bot_assigned', 'open', 'closed']
      .map(key => Number(res[key] || 0))
      .reduce((total, value) => total + value, 0);
  }
}
