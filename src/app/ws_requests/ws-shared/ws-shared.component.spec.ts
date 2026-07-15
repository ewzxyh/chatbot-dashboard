import { Subject, of } from 'rxjs';

import { WsSharedComponent } from './ws-shared.component';

describe('WsSharedComponent request sharing', () => {
  const createComponent = (): any => {
    const component = Object.create(WsSharedComponent.prototype) as any;
    Object.assign(component, {
      botAvatarChecks: new Map(),
      botRequests: new Map(),
      projectUserRequests: new Map(),
      sharedUnsubscribe$: new Subject<void>(),
      activeImageChecks: new Set(),
      botLocalDbService: {
        getBotFromStorage: jasmine.createSpy('getBotFromStorage').and.returnValue(null)
      },
      usersLocalDbService: {
        getMemberFromStorage: jasmine.createSpy('getMemberFromStorage').and.returnValue(null)
      },
      faqKbService: {
        getFaqKbById: jasmine.createSpy('getFaqKbById').and.returnValue(of({ _id: 'bot-1' }))
      },
      usersService: {
        getProjectUserById: jasmine.createSpy('getProjectUserById').and.returnValue(of([]))
      },
      logger: {
        log: () => undefined,
        error: () => undefined
      }
    });
    return component;
  };

  it('uses local placeholders without remote lookups after the preload fails', () => {
    const component = createComponent();

    const agents = component.doParticipatingAgentsArray(
      ['project-user-1', 'bot_bot-1'],
      null,
      '',
      false,
      false
    );

    expect(agents.length).toBe(2);
    expect(component.usersService.getProjectUserById).not.toHaveBeenCalled();
    expect(component.faqKbService.getFaqKbById).not.toHaveBeenCalled();
  });

  it('does not probe avatars or fetch users in the message panel local-only mode', () => {
    const component = createComponent();
    component.checkImageExists = jasmine.createSpy('checkImageExists');

    component.createAgentsArrayFromParticipantsId(['project-user-1'], null, false, '', false);

    expect(component.agents_array).toEqual([
      jasmine.objectContaining({ _id: 'project-user-1', firstname: 'Agente', hasImage: false })
    ]);
    expect(component.usersService.getProjectUserById).not.toHaveBeenCalled();
    expect(component.checkImageExists).not.toHaveBeenCalled();
  });

  it('clears in-flight work on destroy', () => {
    const component = createComponent();
    const image: any = {
      onload: () => undefined,
      onerror: () => undefined,
      src: 'avatar.jpg'
    };
    component.botRequests.set('bot-1', Promise.resolve(null));
    component.projectUserRequests.set('user-1', Promise.resolve(null));
    component.botAvatarChecks.set('avatar', { expiresAt: Date.now(), promise: Promise.resolve(false) });
    component.activeImageChecks.add(image);

    component.ngOnDestroy();

    expect(component.botRequests.size).toBe(0);
    expect(component.projectUserRequests.size).toBe(0);
    expect(component.botAvatarChecks.size).toBe(0);
    expect(component.activeImageChecks.size).toBe(0);
    expect(image.onload).toBeNull();
    expect(image.onerror).toBeNull();
    expect(image.src).toBe('');
    expect(component.sharedUnsubscribe$.isStopped).toBe(true);
  });

  it('shares only an in-flight bot request and removes it after completion', async () => {
    const component = createComponent();

    const firstRequest = component.getBot('bot-1');
    const secondRequest = component.getBot('bot-1');

    expect(secondRequest).toBe(firstRequest);
    expect(component.faqKbService.getFaqKbById).toHaveBeenCalledTimes(1);

    await firstRequest;
    await Promise.resolve();

    expect(component.botRequests.size).toBe(0);
  });
});
