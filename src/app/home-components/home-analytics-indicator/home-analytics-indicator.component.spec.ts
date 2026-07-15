import { of, Subject, throwError } from 'rxjs';

import { HomeAnalyticsIndicatorComponent } from './home-analytics-indicator.component';

describe('HomeAnalyticsIndicatorComponent', () => {
  const createComponent = (getConversationResponse: () => any) => {
    const analyticsService = {
      getLastMountConversationsCount: getConversationResponse
    };
    const logger = {
      log: () => undefined,
      error: () => undefined
    };

    const component = new HomeAnalyticsIndicatorComponent(
      analyticsService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      logger as any,
      {} as any
    );
    component.projectId = 'project-1';
    return component;
  };

  it('shows the conversation count only after a successful response', () => {
    const component = createComponent(() => of([{ totalCount: 7 }]));

    component.getLastMonthConversationsCount();

    expect(component.countOfConversations).toBe(7);
    expect(component.conversationCountLoading).toBe(false);
    expect(component.conversationCountFailed).toBe(false);
  });

  it('keeps the metric unavailable when the request fails', () => {
    const component = createComponent(() => throwError(new Error('request failed')));

    component.getLastMonthConversationsCount();

    expect(component.conversationCountLoading).toBe(false);
    expect(component.conversationCountFailed).toBe(true);
  });

  it('ignores an older response when the project changes from A to B and back to A', () => {
    const firstProjectA = new Subject<any>();
    const projectB = new Subject<any>();
    const currentProjectA = new Subject<any>();
    const responses = [firstProjectA, projectB, currentProjectA];
    const component = createComponent(() => responses.shift());

    component.projectId = 'project-a';
    component.getLastMonthConversationsCount();
    component.projectId = 'project-b';
    component.getLastMonthConversationsCount();
    component.projectId = 'project-a';
    component.getLastMonthConversationsCount();

    currentProjectA.next([{ totalCount: 11 }]);
    firstProjectA.next([{ totalCount: 99 }]);

    expect(component.countOfConversations).toBe(11);
    expect(component.conversationCountLoading).toBe(false);
    expect(component.conversationCountFailed).toBe(false);
  });
});
