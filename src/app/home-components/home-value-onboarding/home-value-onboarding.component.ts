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

interface SummaryCard {
  title: string;
  value: string;
  detail: string;
  icon: string;
  tone: 'ok' | 'attention' | 'neutral';
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
  summaryCards: SummaryCard[] = [];
  private initialized = false;

  constructor(
    private router: Router,
    private integrationService: IntegrationService,
    private wsRequestsService: WsRequestsService,
    private appConfigService: AppConfigService
  ) {}

  ngOnInit() {
    this.initialized = true;
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.chatbots) {
      this.flowCount = this.getFlowCount(this.chatbots);
      this.buildSteps();
    }
    if (this.initialized && changes.projectId && this.projectId) {
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

  get pendingSteps(): number {
    return this.steps.filter(step => !step.done).length;
  }

  get isLoading(): boolean {
    return this.loadingChannels || this.loadingConversations;
  }

  get statusTone(): 'success' | 'warning' | 'neutral' {
    if (this.isLoading) return 'neutral';
    if (this.steps.length && this.completedSteps === this.steps.length) return 'success';
    return 'warning';
  }

  get statusLabel(): string {
    if (this.isLoading) return 'Atualizando';
    if (this.steps.length && this.completedSteps === this.steps.length) return 'Pronto para atender';
    const suffix = this.pendingSteps === 1 ? 'etapa pendente' : 'etapas pendentes';
    return this.pendingSteps + ' ' + suffix;
  }

  get statusDetail(): string {
    if (this.isLoading) return 'Verificando canais e conversas';
    if (this.steps.length && this.completedSteps === this.steps.length) return 'Canais, fluxo e atendimento configurados';
    return 'Siga a próxima ação para ativar o atendimento';
  }

  get attentionStep(): OnboardingStep | null {
    if (this.isLoading) return null;
    return this.steps.find(step => !step.done) || null;
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
    this.buildSummaryCards();
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
    this.buildSummaryCards();
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
        detail: this.channelCount > 0 ? this.formatCount(this.channelCount, 'canal ativo', 'canais ativos') : 'Conecte o canal de atendimento',
        action: this.channelCount > 0 ? 'Gerenciar' : 'Conectar',
        done: this.channelCount > 0,
        enabled: this.canManageChannels,
        icon: 'td-plug-connected'
      },
      {
        key: 'flow',
        title: 'Fluxo inicial',
        detail: this.flowCount > 0 ? this.formatCount(this.flowCount, 'fluxo criado', 'fluxos criados') : 'Use um modelo pronto para começar',
        action: this.flowCount > 0 ? 'Ver fluxos' : 'Usar modelo',
        done: this.flowCount > 0,
        enabled: this.canManageFlows,
        icon: 'td-sitemap'
      },
      {
        key: 'conversation',
        title: 'Primeiro atendimento',
        detail: this.conversationCount > 0 ? this.formatCount(this.conversationCount, 'conversa registrada', 'conversas registradas') : 'Abra o chat para acompanhar as mensagens',
        action: 'Abrir atendimentos',
        done: this.conversationCount > 0,
        enabled: true,
        icon: 'td-message-circle'
      }
    ];
    this.buildSummaryCards();
  }

  private buildSummaryCards() {
    this.summaryCards = [
      {
        title: 'Canais',
        value: this.loadingChannels ? '-' : String(this.channelCount),
        detail: this.channelCount > 0 ? 'conectados' : 'precisa conectar',
        icon: 'td-plug-connected',
        tone: this.channelCount > 0 ? 'ok' : 'attention'
      },
      {
        title: 'Fluxos',
        value: String(this.flowCount),
        detail: this.flowCount > 0 ? 'criados' : 'sem fluxo inicial',
        icon: 'td-sitemap',
        tone: this.flowCount > 0 ? 'ok' : 'attention'
      },
      {
        title: 'Conversas',
        value: this.loadingConversations ? '-' : String(this.conversationCount),
        detail: this.conversationCount > 0 ? 'registradas' : 'sem atendimento ainda',
        icon: 'td-message-circle',
        tone: this.conversationCount > 0 ? 'ok' : 'neutral'
      },
      {
        title: 'Progresso',
        value: this.completedSteps + '/' + this.steps.length,
        detail: 'primeiros passos',
        icon: 'td-check',
        tone: this.steps.length && this.completedSteps === this.steps.length ? 'ok' : 'attention'
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

  private formatCount(count: number, singular: string, plural: string): string {
    return count + ' ' + (count === 1 ? singular : plural);
  }
}
