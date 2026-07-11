import { of, Subject, throwError } from 'rxjs';
import { HomeValueOnboardingComponent } from './home-value-onboarding.component';

describe('HomeValueOnboardingComponent', () => {
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
