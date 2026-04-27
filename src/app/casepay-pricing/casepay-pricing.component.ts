import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { CasepayService } from '../services/casepay.service';
import { ProjectPlanService } from '../services/project-plan.service';
import { AuthService } from '../core/auth.service';
import { LoggerService } from '../services/logger/logger.service';

@Component({
  selector: 'appdashboard-casepay-pricing',
  templateUrl: './casepay-pricing.component.html',
  styleUrls: ['./casepay-pricing.component.scss']
})
export class CasepayPricingComponent implements OnInit, OnDestroy {

  plans: any[] = [];
  projectStatus: any = null;
  isLoading: boolean = false;
  isSubscribing: boolean = false;
  isCanceling: boolean = false;
  isPolling: boolean = false;
  annualBilling: boolean = false;
  userRole: string;
  projectId: string;
  trialExpired: boolean = false;
  isTrialing: boolean = false;
  trialDaysLeft: number = 0;
  errorMessage: string = '';
  showCancelModal: boolean = false;

  private subs: Subscription[] = [];
  private pollingSubscription: Subscription;
  private dataLoaded: boolean = false;

  constructor(
    private casepayService: CasepayService,
    private prjctPlanService: ProjectPlanService,
    public auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private logger: LoggerService
  ) { }

  ngOnInit() {
    this.subs.push(this.auth.project_bs.subscribe((project) => {
      if (project) {
        this.projectId = project._id;
        this.logger.log('[CASEPAY-PRICING] projectId ', this.projectId);
        if (!this.dataLoaded) {
          this.dataLoaded = true;
          this.loadData();
        }
      }
    }));

    this.subs.push(this.prjctPlanService.projectPlan$.subscribe((projectProfileData: any) => {
      this.logger.log('[CASEPAY-PRICING] projectPlan$ data', projectProfileData);
      if (projectProfileData) {
        this.userRole = projectProfileData.user_role;
        this.trialExpired = projectProfileData.trial_expired;
        this.trialDaysLeft = projectProfileData.trial_days_left;

        const profileType = projectProfileData.profile_type;
        this.isTrialing = this.trialDaysLeft > 0 && profileType !== 'payment';

        this.logger.log('[CASEPAY-PRICING] userRole', this.userRole);
        this.logger.log('[CASEPAY-PRICING] trialExpired', this.trialExpired);
        this.logger.log('[CASEPAY-PRICING] trialDaysLeft', this.trialDaysLeft);
        this.logger.log('[CASEPAY-PRICING] isTrialing', this.isTrialing);
      }
    }));

    if (this.router.url.includes('/pricing/te')) {
      this.trialExpired = true;
      this.logger.log('[CASEPAY-PRICING] trial expired route detected');
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';

    this.casepayService.getPlans().subscribe(
      (plans: any[]) => {
        this.plans = plans;
        this.logger.log('[CASEPAY-PRICING] plans loaded', this.plans);
        this.loadStatus();
      },
      (err) => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao carregar os planos. Tente novamente.';
        this.logger.error('[CASEPAY-PRICING] error loading plans', err);
      }
    );
  }

  loadStatus() {
    if (!this.projectId) {
      this.isLoading = false;
      return;
    }

    this.casepayService.getStatus(this.projectId).subscribe(
      (status: any) => {
        this.projectStatus = status;
        this.isLoading = false;
        this.logger.log('[CASEPAY-PRICING] status loaded', this.projectStatus);
      },
      (err) => {
        this.isLoading = false;
        this.logger.error('[CASEPAY-PRICING] error loading status', err);
      }
    );
  }

  getPrice(plan: any): number {
    return this.annualBilling ? plan.annualPrice : plan.monthlyPrice;
  }

  getMonthlyEquivalent(plan: any): number {
    if (this.annualBilling) {
      return +(plan.annualPrice / 12).toFixed(2);
    }
    return plan.monthlyPrice;
  }

  isCurrentPlan(plan: any): boolean {
    if (!this.projectStatus || !this.projectStatus.plan) {
      return false;
    }
    return this.projectStatus.plan.toLowerCase() === plan.name.toLowerCase();
  }

  canSubscribe(plan: any): boolean {
    if (this.userRole && !this.isOwner()) {
      return false;
    }
    if (plan.name.toLowerCase() === 'free') {
      return false;
    }
    if (this.isCurrentPlan(plan) && !this.isTrialing) {
      return false;
    }
    return true;
  }

  isOwner(): boolean {
    return this.userRole === 'owner';
  }

  subscribePlan(plan: any) {
    if (!this.canSubscribe(plan)) {
      return;
    }

    this.isSubscribing = true;
    this.errorMessage = '';
    const billingPeriod = this.annualBilling ? 'annual' : 'monthly';

    this.logger.log('[CASEPAY-PRICING] subscribing to plan', plan.name, billingPeriod);

    this.casepayService.subscribe(this.projectId, plan.key, billingPeriod).subscribe(
      (res: any) => {
        this.logger.log('[CASEPAY-PRICING] subscribe response', res);
        if (res && res.authorizeUrl) {
          window.open(res.authorizeUrl, '_blank');
          this.startPolling();
        } else {
          this.isSubscribing = false;
          this.loadStatus();
        }
      },
      (err) => {
        this.isSubscribing = false;
        if (err.status === 403 && err.error && err.error.error === 'email_not_verified') {
          this.errorMessage = 'Verifique seu email antes de assinar um plano.';
          this.router.navigate(['/verify-email-waiting']);
          return;
        }
        this.errorMessage = 'Erro ao iniciar a assinatura. Tente novamente.';
        this.logger.error('[CASEPAY-PRICING] error subscribing', err);
      }
    );
  }

  startPolling() {
    this.isPolling = true;
    const maxPollingTime = 5 * 60 * 1000; // 5 minutes
    const startTime = Date.now();

    this.pollingSubscription = timer(0, 5000).pipe(
      switchMap(() => this.casepayService.getStatus(this.projectId)),
      takeWhile((status: any) => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= maxPollingTime) {
          return false;
        }
        const mandateStatus = status && status.mandateStatus;
        return mandateStatus !== 'AUTHORIZED' && mandateStatus !== 'active';
      }, true)
    ).subscribe(
      (status: any) => {
        this.logger.log('[CASEPAY-PRICING] polling status', status);
        this.projectStatus = status;

        const mandateStatus = status && status.mandateStatus;
        if (mandateStatus === 'AUTHORIZED' || mandateStatus === 'active') {
          this.isPolling = false;
          this.isSubscribing = false;
          this.logger.log('[CASEPAY-PRICING] payment authorized');
        }
      },
      (err) => {
        this.isPolling = false;
        this.isSubscribing = false;
        this.logger.error('[CASEPAY-PRICING] polling error', err);
      },
      () => {
        this.isPolling = false;
        this.isSubscribing = false;
        this.logger.log('[CASEPAY-PRICING] polling complete');
      }
    );
  }

  checkPayment() {
    this.loadStatus();
  }

  cancelSubscription() {
    this.isCanceling = true;
    this.errorMessage = '';

    this.casepayService.cancel(this.projectId).subscribe(
      (res: any) => {
        this.isCanceling = false;
        this.showCancelModal = false;
        this.logger.log('[CASEPAY-PRICING] subscription canceled', res);
        this.loadStatus();
      },
      (err) => {
        this.isCanceling = false;
        this.errorMessage = 'Erro ao cancelar a assinatura. Tente novamente.';
        this.logger.error('[CASEPAY-PRICING] error canceling', err);
      }
    );
  }

  getFeatureList(plan: any): string[] {
    const features: string[] = [];
    if (plan.agents) {
      features.push(plan.agents + (plan.agents === 1 ? ' agente' : ' agentes'));
    }
    if (plan.quotes) {
      if (plan.quotes.contacts !== undefined) {
        features.push(plan.quotes.contacts.toLocaleString('pt-BR') + ' contatos');
      }
      if (plan.quotes.platforms !== undefined) {
        features.push(plan.quotes.platforms + (plan.quotes.platforms === 1 ? ' plataforma' : ' plataformas'));
      }
      if (plan.quotes.chatbots !== undefined) {
        features.push(plan.quotes.chatbots + ' chatbots');
      }
    }
    if (plan.customization) {
      const channels = [];
      if (plan.customization.whatsapp) channels.push('WhatsApp');
      if (plan.customization.telegram) channels.push('Telegram');
      if (plan.customization.messanger) channels.push('Messenger');
      if (channels.length > 0) {
        features.push(channels.join(', '));
      }
      if (plan.customization.copilot) features.push('Copilot IA');
      if (plan.customization.webhook) features.push('Webhooks');
      if (plan.customization.widgetUnbranding) features.push('Widget sem marca');
      if (plan.customization.smtpSettings) features.push('SMTP personalizado');
    }
    return features;
  }

  getScaleWhatsAppLink(): string {
    return 'https://wa.me/5511999999999?text=Ol%C3%A1!%20Tenho%20interesse%20no%20plano%20Scale%2B%20para%20o%20projeto%20' + this.projectId;
  }
}
