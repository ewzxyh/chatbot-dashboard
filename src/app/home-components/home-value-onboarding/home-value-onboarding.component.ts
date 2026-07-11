import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

interface ChannelLoadResult {
  channel: 'casezap' | 'whatsapp';
  error: boolean;
  instances: any[];
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
  @Output() onboardingAction = new EventEmitter<any>();

  loadingChannels = false;
  loadingConversations = false;
  channelCount = 0;
  flowCount = 0;
  conversationCount = 0;
  activeChannel: 'casezap' | 'whatsapp' = 'casezap';
  channelLoadFailed = false;
  channelPartialFailure = false;
  conversationLoadFailed = false;
  steps: OnboardingStep[] = [];
  private initialized = false;
  private trackedCompletedSteps = new Set<string>();
  private activationTracked = false;
  private trackingInitialized = false;
  private refreshId = 0;

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
    if (changes.chatbots || changes.canManageChannels || changes.canManageFlows) {
      this.flowCount = this.getFlowCount(this.chatbots);
      this.buildSteps();
    }
    if (this.initialized && changes.projectId && this.projectId) {
      if (!changes.projectId.firstChange) {
        this.trackedCompletedSteps.clear();
        this.activationTracked = false;
        this.trackingInitialized = false;
      }
      this.refresh();
    }
  }

  refresh() {
    const refreshId = ++this.refreshId;
    this.flowCount = this.getFlowCount(this.chatbots);
    this.channelCount = 0;
    this.conversationCount = 0;
    this.channelLoadFailed = false;
    this.channelPartialFailure = false;
    this.conversationLoadFailed = false;
    this.loadingChannels = !!this.projectId;
    this.loadingConversations = !!this.projectId;
    this.buildSteps();
    if (!this.projectId) return;
    this.loadChannels(refreshId);
    this.loadConversationCount(refreshId);
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

  get hasLoadError(): boolean {
    return this.channelLoadFailed || this.conversationLoadFailed;
  }

  get isActivated(): boolean {
    return !this.isLoading && !this.hasLoadError && !this.channelPartialFailure && this.steps.length > 0 && this.completedSteps === this.steps.length;
  }

  get statusTone(): 'success' | 'warning' | 'neutral' {
    if (this.isLoading) return 'neutral';
    if (this.isActivated) return 'success';
    return 'warning';
  }

  get statusLabel(): string {
    if (this.isLoading) return 'Atualizando';
    if (this.channelPartialFailure) return 'Verificação parcial';
    if (this.isActivated) return 'Pronto para atender';
    const suffix = this.pendingSteps === 1 ? 'etapa pendente' : 'etapas pendentes';
    return this.pendingSteps + ' ' + suffix;
  }

  get statusDetail(): string {
    if (this.isLoading) return 'Verificando canais e conversas';
    if (this.channelPartialFailure) return 'Um canal não pôde ser verificado agora';
    if (this.isActivated) return 'Canal, resposta automática e atendimento configurados';
    return 'Siga a próxima ação para ativar o atendimento';
  }

  get attentionStep(): OnboardingStep | null {
    if (this.isLoading) return null;
    const pendingSteps = this.steps.filter(step => !step.done);
    return pendingSteps.find(step => step.enabled) || pendingSteps[0] || null;
  }

  retry() {
    this.refresh();
  }

  runStep(step: OnboardingStep) {
    if (!step || !step.enabled) return;
    this.emitAction('Onboarding step clicked', { step: step.key });
    if (step.key === 'channel') {
      this.router.navigate(['project/' + this.projectId + '/integrations'], { queryParams: { name: this.activeChannel } });
    }
    if (step.key === 'flow') {
      const target = this.flowCount > 0 ? 'my-chatbots/all' : 'templates/all';
      this.router.navigate(['project/' + this.projectId + '/bots/' + target]);
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

  private loadChannels(refreshId: number) {
    forkJoin({
      casezap: this.loadChannel('casezap'),
      whatsapp: this.loadChannel('whatsapp')
    }).subscribe((res: { casezap: ChannelLoadResult; whatsapp: ChannelLoadResult }) => {
      if (refreshId !== this.refreshId) return;
      const casezap = this.countActiveInstances(res.casezap.instances);
      const whatsapp = this.countActiveInstances(res.whatsapp.instances);
      this.channelCount = casezap + whatsapp;
      this.channelLoadFailed = res.casezap.error && res.whatsapp.error;
      this.channelPartialFailure = !this.channelLoadFailed && (res.casezap.error || res.whatsapp.error);
      this.activeChannel = casezap > 0 ? 'casezap' : whatsapp > 0 ? 'whatsapp' : res.casezap.error && !res.whatsapp.error ? 'whatsapp' : 'casezap';
      this.loadingChannels = false;
      this.buildSteps();
    }, () => {
      if (refreshId !== this.refreshId) return;
      this.channelLoadFailed = true;
      this.loadingChannels = false;
      this.buildSteps();
    });
  }

  private loadConversationCount(refreshId: number) {
    this.wsRequestsService.getConversationCount(this.projectId).subscribe((res: any) => {
      if (refreshId !== this.refreshId) return;
      this.conversationCount = this.parseConversationCount(res);
      this.loadingConversations = false;
      this.buildSteps();
    }, () => {
      if (refreshId !== this.refreshId) return;
      this.conversationLoadFailed = true;
      this.loadingConversations = false;
      this.buildSteps();
    });
  }

  private buildSteps() {
    this.steps = [
      {
        key: 'channel',
        title: this.channelCount > 0 ? 'Canal conectado' : 'Conecte seu canal',
        detail: this.channelCount > 0 ? this.formatCount(this.channelCount, 'canal ativo', 'canais ativos') : 'Conecte o canal de atendimento',
        action: this.channelCount > 0 ? 'Gerenciar' : 'Conectar',
        done: this.channelCount > 0,
        enabled: this.canManageChannels,
        icon: 'td-plug-connected'
      },
      {
        key: 'flow',
        title: this.flowCount > 0 ? 'Resposta automática pronta' : 'Prepare sua primeira resposta',
        detail: this.flowCount > 0 ? this.formatCount(this.flowCount, 'resposta criada', 'respostas criadas') : 'Use um modelo pronto para começar',
        action: this.flowCount > 0 ? 'Ver fluxos' : 'Usar modelo',
        done: this.flowCount > 0,
        enabled: this.canManageFlows,
        icon: 'td-sitemap'
      },
      {
        key: 'conversation',
        title: this.conversationCount > 0 ? 'Primeiro atendimento concluído' : 'Teste seu atendimento',
        detail: this.conversationCount > 0 ? this.formatCount(this.conversationCount, 'conversa registrada', 'conversas registradas') : 'Envie uma mensagem de teste e acompanhe a conversa',
        action: this.conversationCount > 0 ? 'Abrir atendimentos' : 'Testar atendimento',
        done: this.conversationCount > 0,
        enabled: this.channelCount > 0 && this.flowCount > 0,
        icon: 'td-message-circle'
      }
    ];
    this.trackProgress();
  }

  private getFlowCount(chatbots: any[]): number {
    if (!Array.isArray(chatbots)) return 0;
    return chatbots.filter(bot => {
      if (!bot || bot.type === 'identity' || bot.trashed === true || bot.draft === true) return false;
      if (bot.active === false || bot.isActive === false || bot.enabled === false || bot.published === false) return false;

      const status = String(bot.status ?? bot.state ?? '').trim().toLowerCase();
      if (!status) return true;
      return ['active', 'enabled', 'connected', 'published', 'ready', 'online'].includes(status);
    }).length;
  }

  private countActiveInstances(instances: any): number {
    if (!Array.isArray(instances)) return 0;
    return instances.filter(instance => {
      if (!instance) return false;
      if (instance.trashed === true) return false;
      const status = String(instance.value && instance.value.status || instance.provider_status || instance.status || instance.state || '').toLowerCase();
      if (['disabled', 'disconnected', 'down', 'failed', 'banned', 'restricted'].includes(status)) return false;
      return true;
    }).length;
  }

  private loadChannel(channel: 'casezap' | 'whatsapp') {
    return this.integrationService.getIntegrationInstances(channel, this.projectId).pipe(
      map((instances: any) => ({ channel, error: false, instances: Array.isArray(instances) ? instances : [] } as ChannelLoadResult)),
      catchError(() => of({ channel, error: true, instances: [] } as ChannelLoadResult))
    );
  }

  private trackProgress() {
    if (!this.initialized || !this.projectId || this.isLoading || this.hasLoadError) return;
    if (!this.trackingInitialized) {
      this.trackingInitialized = true;
      for (const step of this.steps) {
        if (step.done) this.trackedCompletedSteps.add(step.key);
      }
      this.activationTracked = this.isActivated;
      this.emitAction('Onboarding viewed', { completedSteps: this.completedSteps });
      return;
    }
    for (const step of this.steps) {
      if (step.done && !this.trackedCompletedSteps.has(step.key)) {
        this.trackedCompletedSteps.add(step.key);
        this.emitAction('Onboarding step completed', { step: step.key });
      }
    }
    if (this.isActivated && !this.activationTracked) {
      this.activationTracked = true;
      this.emitAction('Onboarding activation completed', { completedSteps: this.completedSteps });
    }
  }

  private emitAction(action: string, actionRes: any) {
    this.onboardingAction.emit({ action, actionRes: { ...actionRes, projectId: this.projectId } });
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
