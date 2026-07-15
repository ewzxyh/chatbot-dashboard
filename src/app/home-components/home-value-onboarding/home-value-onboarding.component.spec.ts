import { of, Subject, throwError } from 'rxjs';
import { normalizeConversationSummary } from './home-conversation-summary';
import { HomeValueOnboardingComponent } from './home-value-onboarding.component';

describe('HomeValueOnboardingComponent', () => {
  it('normalizes assignment buckets without double-counting aggregate fields', () => {
    const summary = normalizeConversationSummary({
      unassigned: 2,
      assigned: 3,
      bot_assigned: 4,
      open: 9,
      closed: 7
    });

    expect(summary).toEqual({
      unassigned: 2,
      assigned: 3,
      botAssigned: 4,
      total: 9,
      loaded: true,
      failed: false
    });
  });

  const createComponent = (casezap: any, whatsapp: any, conversations: any) => {
    const router = { navigate: jasmine.createSpy('navigate') };
    const integrationService = {
      getIntegrationInstances: (channel: string) => channel === 'casezap' ? casezap : whatsapp
    };
    const wsRequestsService = { getConversationCount: () => conversations };
    const appConfigService = { getConfig: () => ({ CHAT_BASE_URL: '' }) };
    const component = new HomeValueOnboardingComponent(
      router as any,
      integrationService as any,
      wsRequestsService as any,
      appConfigService as any
    );
    component.projectId = 'project-1';
    return { component, router };
  };

  it('keeps channel errors distinct from an empty channel list', () => {
    const failure = throwError(new Error('offline'));
    const { component } = createComponent(failure, failure, of(0));

    component.ngOnInit();

    expect(component.channelLoadFailed).toBe(true);
    expect(component.channelCount).toBe(0);
    expect(component.hasLoadError).toBe(true);
  });

  it('keeps conversation errors distinct from zero conversations', () => {
    const { component } = createComponent(of([]), of([]), throwError(new Error('offline')));

    component.ngOnInit();

    expect(component.conversationLoadFailed).toBe(true);
    expect(component.hasLoadError).toBe(true);
  });

  it('publishes the current conversation summary to the home dashboard', () => {
    const { component } = createComponent(of([]), of([]), of({ unassigned: 2, assigned: 3, bot_assigned: 1 }));
    const summaries: any[] = [];
    component.conversationSummaryChange.subscribe(summary => summaries.push(summary));

    component.ngOnInit();

    expect(summaries[summaries.length - 1]).toEqual({
      unassigned: 2,
      assigned: 3,
      botAssigned: 1,
      total: 6,
      loaded: true,
      failed: false
    });
  });

  it('opens the provider that produced the active channel', () => {
    const { component, router } = createComponent(of([]), of([{ status: 'connected' }]), of(0));

    component.ngOnInit();
    component.runStep(component.steps[0]);

    expect(component.activeChannel).toBe('whatsapp');
    expect(router.navigate).toHaveBeenCalledWith(
      ['project/project-1/integrations'],
      { queryParams: { name: 'whatsapp' } }
    );
  });

  it('opens the chatbot list when a response exists and templates otherwise', () => {
    const empty = createComponent(of([]), of([]), of(0));
    empty.component.ngOnInit();
    empty.component.runStep(empty.component.steps[1]);

    expect(empty.router.navigate).toHaveBeenCalledWith(['project/project-1/bots/templates/all']);

    const withResponse = createComponent(of([]), of([]), of(0));
    withResponse.component.chatbots = [{ _id: 'flow-1' }];
    withResponse.component.ngOnInit();
    withResponse.component.runStep(withResponse.component.steps[1]);

    expect(withResponse.router.navigate).toHaveBeenCalledWith(['project/project-1/bots/my-chatbots/all']);
  });

  it('does not count draft or inactive responses as ready', () => {
    const { component } = createComponent(of([]), of([]), of(0));
    component.chatbots = [
      { _id: 'draft', draft: true },
      { _id: 'inactive', status: 'inactive' },
      { _id: 'disabled', active: false },
      { _id: 'ready', status: 'active' },
      { _id: 'unknown-status', status: 'pending' }
    ];

    component.ngOnInit();

    expect(component.flowCount).toBe(1);
  });

  it('does not count disconnected providers as active', () => {
    const { component } = createComponent(of([{ value: { status: 'disconnected' } }]), of([]), of(0));

    component.ngOnInit();

    expect(component.channelCount).toBe(0);
    expect(component.steps[0].title).toBe('Conecte seu canal');
  });

  it('rebuilds the next action when permissions arrive', () => {
    const { component } = createComponent(of([]), of([]), of(0));
    component.canManageChannels = false;
    component.ngOnInit();

    component.canManageChannels = true;
    component.ngOnChanges({ canManageChannels: {} as any });

    expect(component.attentionStep.enabled).toBe(true);
  });

  it('selects the first pending action the user can execute', () => {
    const { component } = createComponent(of([]), of([]), of(0));
    component.canManageChannels = false;
    component.canManageFlows = true;

    component.ngOnInit();

    expect(component.attentionStep.key).toBe('flow');
  });

  it('tracks completion transitions once', () => {
    const conversations = new Subject<any>();
    const { component } = createComponent(of([{ status: 'connected' }]), of([]), conversations);
    component.chatbots = [{ _id: 'flow-1' }];
    const actions: any[] = [];
    component.onboardingAction.subscribe(event => actions.push(event));

    component.ngOnInit();
    conversations.next(0);
    expect(actions.filter(event => event.action === 'Onboarding step completed').length).toBe(0);
    component['conversationCount'] = 1;
    component['buildSteps']();
    component['buildSteps']();

    expect(actions.filter(event => event.action === 'Onboarding step completed' && event.actionRes.step === 'conversation').length).toBe(1);
    expect(actions.filter(event => event.action === 'Onboarding activation completed').length).toBe(1);
  });

  it('waits for the first stable load before tracking the baseline', () => {
    const conversations = new Subject<any>();
    const { component } = createComponent(of([{ status: 'connected' }]), of([]), conversations);
    const actions: any[] = [];
    component.onboardingAction.subscribe(event => actions.push(event));

    component.ngOnChanges({ chatbots: {} as any });
    expect(actions.length).toBe(0);
    component.ngOnInit();
    expect(actions.length).toBe(0);
    conversations.next(0);

    expect(actions.map(event => event.action)).toEqual(['Onboarding viewed']);
  });

  it('retries all onboarding requests', () => {
    const { component } = createComponent(of([]), of([]), of(0));
    spyOn(component, 'refresh');

    component.retry();

    expect(component.refresh).toHaveBeenCalled();
  });
});
