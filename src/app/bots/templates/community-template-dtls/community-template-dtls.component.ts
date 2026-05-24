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

    if (!this.templateId || !this.projectId || !this.template || !this.project || !this.project._id || !this.chatBotsLoaded || !this.roleLoaded || !this.planLoaded) {
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
    this.faqKbService.getCommunityTemplateDetail(templateId)
      .subscribe((_template: any) => {
        this.logger.log('[COMMUNITY-TEMPLATE-DTLS] GET COMMUNITY TEMPLATE - template ', _template);
        if (_template) {
          this.template = _template;
          this.botname = _template.name;
          this.buildTemplatePreview(_template);
          this.tryAutoImport();
        }
      })
  }

  buildTemplatePreview(template: any) {
    const intents = Array.isArray(template && template.intents) ? template.intents : [];
    const sortedIntents = intents.slice().sort((current, next) => {
      return this.getIntentPreviewWeight(current) - this.getIntentPreviewWeight(next);
    });

    this.previewChannels = template &&
      template.attributes &&
      Array.isArray(template.attributes.channels) ? template.attributes.channels : [];

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
      casezap: 'CaseZap',
      telegram: 'Telegram',
      messenger: 'Messenger',
      sms: 'SMS',
      email: 'E-mail',
      widget: 'Widget'
    };

    return labels[channel] || channel;
  }


  goBack() {
    this.location.back();
  }

  importTemplate() {
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
    this.faqKbService.installTemplate(this.templateId, this.projectId, true, this.projectId).subscribe((res: any) => {
      this.logger.log('[COMMUNITY-TEMPLATE-DTLS] - FORK TEMPLATE RES', res);
      this.botid = res.bot_id

    }, (error) => {
      this.logger.error('[COMMUNITY-TEMPLATE-DTLS] FORK TEMPLATE - ERROR ', error);
      this.isAutoImporting = false;

    }, () => {
      this.logger.log('[COMMUNITY-TEMPLATE-DTLS] FORK TEMPLATE COMPLETE');
     
      this.goToBotDetails()
      this.trackImportTemplate();

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
      _id : this.botid
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
