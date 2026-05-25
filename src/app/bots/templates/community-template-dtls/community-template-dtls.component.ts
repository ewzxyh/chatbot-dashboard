import { Component, OnInit , isDevMode} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/core/auth.service';
import { AppConfigService } from 'app/services/app-config.service';
import { FaqKbService } from 'app/services/faq-kb.service';
import { LoggerService } from 'app/services/logger/logger.service';
import { Location } from '@angular/common';
import { DepartmentService } from 'app/services/department.service';
import { Project } from 'app/models/project-model';
import { goToCDSVersion } from 'app/utils/util';
import { PricingBaseComponent } from 'app/pricing/pricing-base/pricing-base.component';
import { ProjectPlanService } from 'app/services/project-plan.service';
import { UsersService } from 'app/services/users.service';
import { User } from 'app/models/user-model';
import { ChatbotModalComponent } from 'app/bots/bots-list/chatbot-modal/chatbot-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { NotifyService } from 'app/core/notify.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'appdashboard-community-template-dtls',
  templateUrl: './community-template-dtls.component.html',
  styleUrls: ['./community-template-dtls.component.scss']
})

export class CommunityTemplateDtlsComponent extends PricingBaseComponent implements OnInit {

  public templateId: string;
  public projectId: string;
  public template: any;
  description: any;
  public isChromeVerGreaterThan100: boolean;
  public UPLOAD_ENGINE_IS_FIREBASE: boolean;
  public storageBucket: string;
  public baseUrl: string;
  public botid: string;
  public TESTSITE_BASE_URL: string;
  public defaultDepartmentId: string;
  public chatBotCount: number;
  public autoInstallRequested = false;
  public isAutoImporting = false;
  project: Project;
  USER_ROLE: string;
  user: User;
  public botname: string;
  projectName: string;
  learnMoreAboutDefaultRoles: string;
  agentsCannotManageChatbots: string;
  public autoImportStarted = false;
  public previewMessages: Array<{
    title: string;
    question: string;
    text: string;
    buttons: string[];
  }> = [];
  public previewBlocks: Array<{
    name: string;
    question: string;
    aliases: string[];
  }> = [];
  public previewChannels: string[] = [];
  public publicationReadiness: Array<{
    channel: string;
    status: string;
    title: string;
    description: string;
  }> = [];
  public wabaTemplateSuggestions: Array<{
    name: string;
    category: string;
    language: string;
    body: string;
    variables: string[];
    buttons: string[];
  }> = [];
  public publicationChecklist: string[] = [];
  public wabaPublicationResult: any;
  public wabaPublicationError: string;
  public wabaStatusSyncResult: any;
  public wabaStatusSyncError: string;
  public wabaBindingResult: any;
  public wabaBindingError: string;
  public activeWabaPublicationName: string;
  public activeWabaBindingName: string;
  public isPreparingWabaPublication = false;
  public isPublishingWabaTemplate = false;
  public isSyncingWabaStatus = false;
  public isBindingWabaTemplate = false;
  public isTemplateLoading = false;
  public selectedChannel: string = 'casezap';
  public selectedChannelUnsupported = false;
  public channelOptions = [
    { id: 'casezap', label: 'CaseZap' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'waba', label: 'WABA' },
    { id: 'telegram', label: 'Telegram' }
  ];
  private chatBotsLoaded = false;
  private roleLoaded = false;
  private planLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private faqKbService: FaqKbService,
    private auth: AuthService,
    public appConfigService: AppConfigService,
    private logger: LoggerService,
    public location: Location,
    private router: Router,
    private departmentService: DepartmentService,
    public prjctPlanService: ProjectPlanService,
    public usersService: UsersService,
    public dialog: MatDialog,
    public notify: NotifyService,
    private translate: TranslateService,
  ) {    
     super(prjctPlanService, notify);
  }

  ngOnInit(): void {
    this.watchAutoInstallParams();
    this.getParamsAndTemplateDetails();
    this.getBrowserVersion();
    this.getProfileImageStorage();
    this.getDeptsByProjectId();
    this.getCurrentProject();
    this.getTestSiteUrl();
    this.getUserRole();
    this.getLoggedUser();
    this.getProjectBots();
    this.getProjectPlan();
    this.watchProjectPlanForAutoImport();
    this.traslateString();
  }

  watchAutoInstallParams() {
    this.route.queryParamMap.subscribe((params) => {
      this.autoInstallRequested = this.isEnabledQueryParam(params.get('install')) || this.isEnabledQueryParam(params.get('autoinstall'));
      const channel = this.normalizeChannel(params.get('channel'));
      if (channel && channel !== this.selectedChannel) {
        this.selectedChannel = channel;
        this.selectedChannelUnsupported = false;
        if (this.templateId) {
          this.getCommunityTemplateDetails(this.templateId);
        }
      }
      this.tryAutoImport();
    });
  }

  watchProjectPlanForAutoImport() {
    this.prjctPlanService.projectPlan$.subscribe((projectProfileData: any) => {
      if (projectProfileData) {
        if (projectProfileData.user_role) {
          this.USER_ROLE = projectProfileData.user_role;
          this.roleLoaded = true;
        }
        this.planLoaded = true;
        this.tryAutoImport();
      }
    });
  }

  isEnabledQueryParam(value: any): boolean {
    return ['1', 'true', 'yes', 'y'].includes(String(value || '').toLowerCase());
  }

  tryAutoImport() {
    if (!this.autoInstallRequested || this.autoImportStarted) {
      return;
    }

    if (!this.templateId || !this.projectId || !this.template || !this.project || !this.project._id || !this.chatBotsLoaded || !this.roleLoaded || !this.planLoaded || this.selectedChannelUnsupported || this.isTemplateLoading) {
      return;
    }

    this.autoImportStarted = true;
    this.isAutoImporting = true;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { install: null, autoinstall: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.importTemplate();
  }


  getProjectBots() {
    this.faqKbService.getFaqKbByProjectId().subscribe((faqKb: any) => {
      this.logger.log('[COMMUNITY-TEMPLATE-DTLS] - GET CHATBOTS RES', faqKb);

      if (faqKb) {
        this.chatBotCount = faqKb.length;
        this.logger.log('[COMMUNITY-TEMPLATE-DTLS] - COUNT OF CHATBOTS', this.chatBotCount);
      }
      this.chatBotsLoaded = true;
      this.tryAutoImport();
    }, (error) => {
      this.logger.error('[COMMUNITY-TEMPLATE-DTLS] - GET CHATBOTS - ERROR ', error);
      this.chatBotsLoaded = true;
      this.tryAutoImport();

    }, () => {
      this.logger.log('[COMMUNITY-TEMPLATE-DTLS] - GET CHATBOTS * COMPLETE *');
    });
  }

  getLoggedUser() {
    this.auth.user_bs
      .subscribe((user) => {
        if (user) {
          this.user = user;
        }
      });
  }

  getUserRole() {
    this.usersService.project_user_role_bs
      .subscribe((userRole) => {
        this.logger.log('[COMMUNITY-TEMPLATE-DTLS] - SUBSCRIPTION TO USER ROLE »»» ', userRole)
        this.USER_ROLE = userRole;
        if (userRole) {
          this.roleLoaded = true;
          this.tryAutoImport();
        }
      })
  }

  getProfileImageStorage() {
    if (this.appConfigService.getConfig().uploadEngine === 'firebase') {
      this.UPLOAD_ENGINE_IS_FIREBASE = true;
      const firebase_conf = this.appConfigService.getConfig().firebase;
      this.storageBucket = firebase_conf['storageBucket'];
      this.logger.log('[BOTS-TEMPLATES] IMAGE STORAGE ', this.storageBucket, 'usecase Firebase')
    } else {
      this.UPLOAD_ENGINE_IS_FIREBASE = false;
      this.baseUrl = this.appConfigService.getConfig().SERVER_BASE_URL;

      this.logger.log('[BOTS-TEMPLATES] IMAGE STORAGE ', this.baseUrl, 'usecase native')
    }
  }

  getParamsAndTemplateDetails() {
    this.route.params.subscribe((params) => {
      this.logger.log('[COMMUNITY-TEMPLATE-DTLS] GET PARAMS - params ', params);
      if (params) {
        this.templateId = params.templateid
        this.projectId = params.projectid
        this.getCommunityTemplateDetails(this.templateId)
      }
    });
  }

  getBrowserVersion() {
    this.auth.isChromeVerGreaterThan100.subscribe((isChromeVerGreaterThan100: boolean) => {
      this.isChromeVerGreaterThan100 = isChromeVerGreaterThan100;
    })
  }

  getCommunityTemplateDetails(templateId) {
    const requestedChannel = this.selectedChannel;
    this.isTemplateLoading = true;
    this.faqKbService.getCommunityTemplateDetail(templateId, this.selectedChannel)
      .subscribe((_template: any) => {
        if (requestedChannel !== this.selectedChannel) {
          return;
        }
        this.logger.log('[COMMUNITY-TEMPLATE-DTLS] GET COMMUNITY TEMPLATE - template ', _template);
        if (_template) {
          this.template = _template;
          this.botname = _template.name;
          this.buildTemplatePreview(_template);
          this.tryAutoImport();
        }
      }, (error) => {
        if (requestedChannel !== this.selectedChannel) {
          return;
        }
        this.logger.warn('[COMMUNITY-TEMPLATE-DTLS] GET COMMUNITY TEMPLATE FOR CHANNEL ERROR ', error);
        this.selectedChannelUnsupported = true;
        this.faqKbService.getCommunityTemplateDetail(templateId)
          .subscribe((templateWithoutChannel: any) => {
            if (requestedChannel !== this.selectedChannel) {
              return;
            }
            this.template = templateWithoutChannel;
            this.botname = templateWithoutChannel.name;
            this.buildTemplatePreview(templateWithoutChannel);
          }, () => {
            if (requestedChannel === this.selectedChannel) {
              this.isTemplateLoading = false;
            }
          }, () => {
            if (requestedChannel === this.selectedChannel) {
              this.isTemplateLoading = false;
            }
          });
      }, () => {
        if (requestedChannel === this.selectedChannel) {
          this.isTemplateLoading = false;
        }
      })
  }

  buildTemplatePreview(template: any) {
    const intents = Array.isArray(template && template.intents) ? template.intents : [];
    const sortedIntents = intents.slice().sort((current, next) => {
      return this.getIntentPreviewWeight(current) - this.getIntentPreviewWeight(next);
    });

    this.previewChannels = this.getTemplateChannels(template);
    if (!this.templateSupportsChannel(template, this.selectedChannel)) {
      this.selectedChannelUnsupported = true;
    } else {
      this.selectedChannelUnsupported = false;
    }

    this.previewMessages = sortedIntents
      .filter((intent) => this.shouldShowIntentInConversationPreview(intent))
      .slice(0, 4)
      .map((intent) => ({
        title: this.getIntentDisplayLabel(intent),
        question: this.getIntentQuestionLabel(intent),
        text: this.getIntentMessageText(intent),
        buttons: this.getIntentButtons(intent)
      }));

    this.previewBlocks = sortedIntents
      .filter((intent) => intent && intent.intent_display_name !== 'defaultFallback')
      .map((intent) => ({
        name: this.getIntentDisplayLabel(intent),
        question: this.getIntentQuestionLabel(intent),
        aliases: this.getIntentAliases(intent)
      }));

    const publication = template &&
      template.attributes &&
      template.attributes.publication ? template.attributes.publication : {};

    const readiness = Array.isArray(publication.readiness) ? publication.readiness : [];
    this.publicationReadiness = readiness.filter((item) => this.normalizeChannel(item.channel) === this.selectedChannel);
    this.wabaTemplateSuggestions = this.isSelectedWabaChannel() && Array.isArray(publication.wabaTemplates) ? publication.wabaTemplates : [];
    this.publicationChecklist = Array.isArray(publication.checklist) ? publication.checklist : [];
    this.wabaStatusSyncResult = undefined;
    this.wabaStatusSyncError = undefined;
    this.wabaBindingResult = undefined;
    this.wabaBindingError = undefined;
  }

  getIntentPreviewWeight(intent: any): number {
    if (!intent) {
      return 999;
    }

    if (intent.intent_display_name === 'start') {
      return 0;
    }

    if (intent.intent_display_name === 'menu') {
      return 1;
    }

    if (/^[0-9]+$/.test(intent.question || '')) {
      return 10 + Number(intent.question);
    }

    if (intent.intent_display_name === 'defaultFallback') {
      return 900;
    }

    return 100;
  }

  shouldShowIntentInConversationPreview(intent: any): boolean {
    if (!intent || intent.intent_display_name === 'defaultFallback') {
      return false;
    }

    return intent.intent_display_name === 'start' ||
      intent.intent_display_name === 'menu' ||
      /^[0-9]+$/.test(intent.question || '');
  }

  getIntentDisplayLabel(intent: any): string {
    if (!intent) {
      return 'Bloco';
    }

    const names = {
      start: 'Saudacao',
      menu: 'Menu',
      defaultFallback: 'Fallback',
      human_handoff: 'Atendimento humano',
      order_status: 'Status do pedido',
      exchange_return: 'Trocas e devolucoes',
      schedule: 'Agendamento',
      prices: 'Valores',
      menu_link: 'Cardapio',
      hours_delivery: 'Horario e entrega',
      buy_property: 'Compra de imovel',
      rent_property: 'Aluguel de imovel',
      schedule_visit: 'Agendar visita',
      courses: 'Cursos',
      pricing: 'Valores',
      enrollment: 'Matricula'
    };

    return names[intent.intent_display_name] || intent.intent_display_name || 'Bloco';
  }

  getIntentQuestionLabel(intent: any): string {
    if (!intent || !intent.question) {
      return '';
    }

    return String(intent.question).replace(/\\/g, '/');
  }

  getIntentMessageText(intent: any): string {
    if (!intent) {
      return '';
    }

    const commands = (intent.actions || [])
      .reduce((acc, action) => acc.concat(action.attributes && action.attributes.commands || []), []);
    const messageCommand = commands.find((command) => command.type === 'message' && command.message);
    const message = messageCommand && messageCommand.message;

    return message && message.text || intent.answer || '';
  }

  getIntentButtons(intent: any): string[] {
    const commands = (intent && intent.actions || [])
      .reduce((acc, action) => acc.concat(action.attributes && action.attributes.commands || []), []);
    const messageCommand = commands.find((command) => command.type === 'message' && command.message);
    const buttons = messageCommand &&
      messageCommand.message &&
      messageCommand.message.attributes &&
      messageCommand.message.attributes.attachment &&
      messageCommand.message.attributes.attachment.buttons || [];

    return buttons
      .map((button) => button.value || button.label || button.title)
      .filter((button) => !!button);
  }

  getIntentAliases(intent: any): string[] {
    return intent &&
      intent.attributes &&
      Array.isArray(intent.attributes.aliases) ? intent.attributes.aliases : [];
  }

  getChannelLabel(channel: string): string {
    const labels = {
      whatsapp: 'WhatsApp',
      waba: 'WABA',
      casezap: 'CaseZap',
      telegram: 'Telegram',
      messenger: 'Messenger',
      sms: 'SMS',
      email: 'E-mail',
      widget: 'Widget'
    };

    return labels[channel] || channel;
  }

  normalizeChannel(channel: string): string {
    return String(channel || '').trim().toLowerCase();
  }

  isSelectedWabaChannel(): boolean {
    return this.selectedChannel === 'waba';
  }

  selectChannel(channel: string) {
    const normalizedChannel = this.normalizeChannel(channel);
    if (!normalizedChannel || normalizedChannel === this.selectedChannel) {
      return;
    }

    this.selectedChannel = normalizedChannel;
    this.selectedChannelUnsupported = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { channel: normalizedChannel },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    if (this.templateId) {
      this.getCommunityTemplateDetails(this.templateId);
    }
  }

  getTemplateChannels(template: any): string[] {
    const attributes = template && template.attributes ? template.attributes : {};
    const channels = Array.isArray(attributes.availableChannels)
      ? attributes.availableChannels
      : Array.isArray(attributes.channels)
        ? attributes.channels
        : [];

    return channels
      .map((channel) => this.normalizeChannel(channel))
      .filter((channel, index, all) => channel && all.indexOf(channel) === index);
  }

  templateSupportsChannel(template: any, channel: string): boolean {
    const normalizedChannel = this.normalizeChannel(channel);
    const attributes = template && template.attributes ? template.attributes : {};
    const compatibility = attributes.channelCompatibility || {};

    if (compatibility[normalizedChannel]) {
      return compatibility[normalizedChannel].status !== 'unsupported';
    }

    return this.getTemplateChannels(template).indexOf(normalizedChannel) !== -1;
  }

  getSelectedChannelCompatibility(): any {
    return this.template &&
      this.template.attributes &&
      this.template.attributes.channelCompatibility ?
      this.template.attributes.channelCompatibility[this.selectedChannel] : null;
  }

  getPublicationStatusLabel(status: string): string {
    const labels = {
      ready: 'Pronto',
      requires_approval: 'Requer aprovacao'
    };

    return labels[status] || status;
  }

  getPublicationStatusClass(status: string): string {
    return status === 'ready' ? 'is-ready' : 'requires-approval';
  }

  prepareWabaPublication(suggestionName: string, publish: boolean = false) {
    if (!this.templateId || !this.projectId || !suggestionName) {
      return;
    }

    if (publish === true && !window.confirm('Enviar este template para aprovacao na Meta?')) {
      return;
    }

    this.activeWabaPublicationName = suggestionName;
    this.wabaPublicationError = undefined;
    this.wabaPublicationResult = undefined;
    this.isPreparingWabaPublication = publish !== true;
    this.isPublishingWabaTemplate = publish === true;

    this.faqKbService.prepareWabaTemplatePublication(this.templateId, this.projectId, suggestionName, publish)
      .subscribe((result: any) => {
        this.wabaPublicationResult = result;
      }, (error) => {
        this.logger.error('[COMMUNITY-TEMPLATE-DTLS] WABA template publication error', error);
        this.wabaPublicationError = this.getWabaPublicationError(error);
        this.isPreparingWabaPublication = false;
        this.isPublishingWabaTemplate = false;
      }, () => {
        this.isPreparingWabaPublication = false;
        this.isPublishingWabaTemplate = false;
      });
  }

  syncWabaPublicationStatus() {
    if (!this.templateId || !this.projectId || !this.wabaTemplateSuggestions || !this.wabaTemplateSuggestions.length) {
      return;
    }

    this.isSyncingWabaStatus = true;
    this.wabaStatusSyncError = undefined;

    this.faqKbService.syncWabaTemplatePublicationStatus(this.templateId, this.projectId)
      .subscribe((result: any) => {
        this.wabaStatusSyncResult = result;
      }, (error) => {
        this.logger.error('[COMMUNITY-TEMPLATE-DTLS] WABA template status sync error', error);
        this.wabaStatusSyncError = this.getWabaPublicationError(error);
        this.isSyncingWabaStatus = false;
      }, () => {
        this.isSyncingWabaStatus = false;
      });
  }

  getWabaTemplateStatus(name: string): any {
    const items = this.wabaStatusSyncResult && Array.isArray(this.wabaStatusSyncResult.templates) ?
      this.wabaStatusSyncResult.templates : [];
    return items.find((item) => item.name === name);
  }

  getWabaTemplateStateLabel(state: string): string {
    const labels = {
      approved: 'Aprovado',
      pending: 'Pendente',
      rejected: 'Rejeitado',
      not_found: 'Nao encontrado',
      unknown: 'Desconhecido'
    };

    return labels[state] || state || 'Desconhecido';
  }

  getWabaTemplateStateClass(state: string): string {
    if (state === 'approved') {
      return 'is-ready';
    }
    if (state === 'pending') {
      return 'is-pending';
    }
    if (state === 'rejected') {
      return 'is-rejected';
    }
    return 'requires-approval';
  }

  getFirstWabaSuggestionName(): string {
    return this.wabaTemplateSuggestions && this.wabaTemplateSuggestions.length ?
      this.wabaTemplateSuggestions[0].name : undefined;
  }

  isWabaTemplateApproved(name: string): boolean {
    const status = this.getWabaTemplateStatus(name);
    return status && status.state === 'approved';
  }

  canBindWabaTemplate(name: string): boolean {
    return !!(this.botid && name && this.isWabaTemplateApproved(name) && !this.isBindingWabaTemplate);
  }

  bindWabaTemplateToBot(suggestionName: string, navigateAfterBind: boolean = false) {
    if (!this.templateId || !this.projectId || !this.botid || !suggestionName) {
      if (navigateAfterBind) {
        this.finishTemplateImport();
      }
      return;
    }

    this.activeWabaBindingName = suggestionName;
    this.wabaBindingError = undefined;
    this.wabaBindingResult = undefined;
    this.isBindingWabaTemplate = true;

    this.faqKbService.bindApprovedWabaTemplateToBot(this.templateId, this.projectId, this.botid, suggestionName)
      .subscribe((result: any) => {
        this.wabaBindingResult = result;
        if (result && result.sync) {
          this.wabaStatusSyncResult = result.sync;
        }
        if (!navigateAfterBind) {
          this.notify.showNotification('Template WABA vinculado ao fluxo.', 2, 'done');
        }
      }, (error) => {
        this.logger.error('[COMMUNITY-TEMPLATE-DTLS] WABA template bind error', error);
        this.wabaBindingError = this.getWabaPublicationError(error);
        this.isBindingWabaTemplate = false;
        if (navigateAfterBind) {
          this.notify.showNotification('Fluxo importado. Template WABA ainda nao foi vinculado: ' + this.wabaBindingError, 3, 'warning');
          this.finishTemplateImport();
        }
      }, () => {
        this.isBindingWabaTemplate = false;
        if (navigateAfterBind) {
          this.finishTemplateImport();
        }
      });
  }

  finishTemplateImport() {
    this.goToBotDetails();
    this.trackImportTemplate();
  }

  getWabaPublicationError(error: any): string {
    const body = error && error.error;
    if (body && body.error) {
      return body.error;
    }
    if (body && body.providerError && body.providerError.error && body.providerError.error.message) {
      return body.providerError.error.message;
    }
    if (error && error.message) {
      return error.message;
    }
    return 'Nao foi possivel preparar o template WABA.';
  }

  getWabaPayloadJson(): string {
    if (!this.wabaPublicationResult || !this.wabaPublicationResult.metaPayload) {
      return '';
    }

    return JSON.stringify(this.wabaPublicationResult.metaPayload, null, 2);
  }

  copyWabaPayload() {
    if (!navigator || !navigator.clipboard || !this.getWabaPayloadJson()) {
      return;
    }

    navigator.clipboard.writeText(this.getWabaPayloadJson());
  }


  goBack() {
    this.location.back();
  }

  importTemplate() {
    if (this.selectedChannelUnsupported || this.isTemplateLoading) {
      this.isAutoImporting = false;
      return;
    }

    // this.faqKbService.installTemplate(this.templateId, this.projectId, true, this.projectId).subscribe((res: any) => {
    //   this.logger.log('[COMMUNITY-TEMPLATE-DTLS] - FORK TEMPLATE RES', res);
    //   this.botid = res.bot_id

    // }, (error) => {
    //   this.logger.error('[COMMUNITY-TEMPLATE-DTLS] FORK TEMPLATE - ERROR ', error);

    // }, () => {
    //   this.logger.log('[COMMUNITY-TEMPLATE-DTLS] FORK TEMPLATE COMPLETE');
    //   this.goToBotDetails()
    // });
    this.logger.log('[COMMUNITY-TEMPLATE-DTLS] importTemplate chatBotCount ', this.chatBotCount, ' chatBotLimit ', this.chatBotLimit, ' USER_ROLE ', this.USER_ROLE, ' profile_name ', this.profile_name)
    if (this.USER_ROLE !== 'agent') {
      if (this.chatBotLimit) {
        if (this.chatBotCount < this.chatBotLimit) {
          this.logger.log('[COMMUNITY-TEMPLATE-DTLS] USECASE  chatBotCount < chatBotLimit: RUN FORK')
          this.forkTemplate()
        } else if (this.chatBotCount >= this.chatBotLimit) {
          this.logger.log('[COMMUNITY-TEMPLATE-DTLS] USECASE  chatBotCount >= chatBotLimit DISPLAY MODAL')
          this.presentDialogReachedChatbotLimit()
        }
      } else if (!this.chatBotLimit) {
        this.logger.log('[COMMUNITY-TEMPLATE-DTLS] USECASE  NO chatBotLimit: RUN FORK')
        this.forkTemplate()
      }
    } if (this.USER_ROLE === 'agent') {
      this.isAutoImporting = false;
      this.presentModalOnlyOwnerCanManageChatbot()
    }
  }

  forkTemplate() {
    if (this.selectedChannelUnsupported || this.isTemplateLoading) {
      this.isAutoImporting = false;
      return;
    }

      this.faqKbService.installTemplate(this.templateId, this.projectId, true, this.projectId, this.selectedChannel).subscribe((res: any) => {
      this.logger.log('[COMMUNITY-TEMPLATE-DTLS] - FORK TEMPLATE RES', res);
      this.botid = res.bot_id

    }, (error) => {
      this.logger.error('[COMMUNITY-TEMPLATE-DTLS] FORK TEMPLATE - ERROR ', error);
      this.isAutoImporting = false;

    }, () => {
      this.logger.log('[COMMUNITY-TEMPLATE-DTLS] FORK TEMPLATE COMPLETE');
      const wabaSuggestionName = this.isSelectedWabaChannel() ? this.getFirstWabaSuggestionName() : undefined;
      if (wabaSuggestionName) {
        this.bindWabaTemplateToBot(wabaSuggestionName, true);
      } else {
        this.finishTemplateImport();
      }

    });
  }

  presentDialogReachedChatbotLimit() {
    this.isAutoImporting = false;
    this.logger.log('[COMMUNITY-TEMPLATE-DTLS] openDialog presentDialogReachedChatbotLimit prjct_profile_name ', this.prjct_profile_name)
    const dialogRef = this.dialog.open(ChatbotModalComponent, {
      backdropClass: 'cdk-overlay-transparent-backdrop',
      hasBackdrop: true,
      data: {
        projectProfile: this.prjct_profile_name,
        subscriptionIsActive: this.subscription_is_active,
        prjctProfileType: this.prjct_profile_type,
        trialExpired: this.trial_expired,
        chatBotLimit: this.chatBotLimit
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.logger.log(`[COMMUNITY-TEMPLATE-DTLS] Dialog result: ${result}`);
    });
  }

  presentModalOnlyOwnerCanManageChatbot() {
    this.notify.presentModalAgentCannotManageChatbot(this.agentsCannotManageChatbots, this.learnMoreAboutDefaultRoles)
  }


  goToBotDetails() {
    // this.router.navigate(['project/' + this.projectId + '/cds/', this.botid, 'intent', '0'])
    let faqkb = {
      createdAt: new Date(),
      _id : this.botid,
      attributes: {
        targetChannel: this.selectedChannel
      }
    }
    goToCDSVersion(this.router, faqkb, this.project._id, this.appConfigService.getConfig().cdsBaseUrl)
  }

  getCurrentProject() {
    this.auth.project_bs.subscribe((project) => {
      this.project = project;
      if (project) {
        this.projectName = project.name
        if (project['role'] && !this.USER_ROLE) {
          this.USER_ROLE = project['role'];
          this.roleLoaded = true;
        }
        this.logger.log('[COMMUNITY-TEMPLATE-DTLS] project from AUTH service subscription  ', this.project)
        this.tryAutoImport();
      }
    });
  }

  getDeptsByProjectId() {
    this.departmentService.getDeptsByProjectId().subscribe((departments: any) => {
      this.logger.log('[COMMUNITY-TEMPLATE-DTLS] - DEPT GET DEPTS ', departments);

      if (departments) {
        departments.forEach((dept: any) => {

          if (dept.default === true) {
            this.defaultDepartmentId = dept._id;
            this.logger.log('[COMMUNITY-TEMPLATE-DTLS - DEFAULT DEPT ID ',  this.defaultDepartmentId);
          }
        });
      }
    }, error => {

      this.logger.error('[COMMUNITY-TEMPLATE-DTLS] - DEPT - GET DEPTS  - ERROR', error);
    }, () => {
      this.logger.log('[COMMUNITY-TEMPLATE-DTLS] - DEPT - GET DEPTS - COMPLETE')

    });
  }


  getTestSiteUrl() {
    this.TESTSITE_BASE_URL = this.appConfigService.getConfig().WIDGET_BASE_URL + 'assets/twp/index.html';
    this.logger.log('[COMMUNITY-TEMPLATE-DTLS] AppConfigService getAppConfig TESTSITE_BASE_URL', this.TESTSITE_BASE_URL);
  }

  openTestSiteInPopupWindow() {
    // this.logger.log('openTestSiteInPopupWindow TESTSITE_BASE_URL', this.TESTSITE_BASE_URL)
    const testItOutBaseUrl = this.TESTSITE_BASE_URL.substring(0, this.TESTSITE_BASE_URL.lastIndexOf('/'));
    const testItOutUrl = testItOutBaseUrl + '/chatbot-panel.html'
    // this.logger.log('openTestSiteInPopupWindow testItOutBaseUrl' , testItOutBaseUrl )  
    const url = testItOutUrl + '?tiledesk_projectid=' + this.project._id + '&tiledesk_participants=bot_' + this.templateId + "&tiledesk_departmentID=" + this.defaultDepartmentId
    // this.logger.log('openTestSiteInPopupWindow URL ', url) 
    let params = `toolbar=no,menubar=no,width=815,height=727,left=100,top=100`;
    window.open(url, '_blank', params);
  }

  trackImportTemplate() {
    if (!isDevMode()) {
      if (window['analytics']) {

        let userFullname = ''
        if (this.user.firstname && this.user.lastname) {
          userFullname = this.user.firstname + ' ' + this.user.lastname
        } else if (this.user.firstname && !this.user.lastname) {
          userFullname = this.user.firstname
        }

        try {
          window['analytics'].track('Create chatbot', {
            "username": userFullname,
            "email": this.user.email,
            "userId": this.user._id,
            "chatbotName": this.botname,
            'chatbotId': this.botid,
            'page': 'Community templates',
            'button': 'Import Template',
          });
        } catch (err) {
          // this.logger.error('track Import template (install template) event error', err);
        }

        try {
          window['analytics'].identify(this.user._id, {
            name: userFullname,
            email: this.user.email,
            logins: 5,

          });
        } catch (err) {
          // this.logger.error('Identify Import template (install template) event error', err);
        }

        try {
          window['analytics'].group(this.projectId, {
            name: this.projectName,
            plan: this.prjct_profile_name,
          });
        } catch (err) {
          // this.logger.error('Group Import template (install template) error', err);
        }

      }
    }
  }

  traslateString() {
    this.translate
      .get('LearnMoreAboutDefaultRoles')
      .subscribe((translation: any) => {
        this.learnMoreAboutDefaultRoles = translation
      })

    this.translate
      .get('AgentsCannotManageChatbots')
      .subscribe((translation: any) => {
        this.agentsCannotManageChatbots = translation
      })
  }



}
