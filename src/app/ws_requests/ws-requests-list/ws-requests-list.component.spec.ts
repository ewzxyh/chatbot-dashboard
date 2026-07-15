import { WsRequestsListComponent } from './ws-requests-list.component';
import { of, Subject } from 'rxjs';

describe('WsRequestsListComponent loading gate', () => {
  const createComponent = (): WsRequestsListComponent => {
    const component = Object.create(WsRequestsListComponent.prototype) as WsRequestsListComponent;
    Object.assign(component, {
      logger: { log: () => undefined },
      unsubscribe$: new Subject<void>(),
      pendingWsRequestsLoad: false,
      projectUsersLoaded: false,
      projectUsersLoading: false,
      projectUsersLoadFailed: false
    });
    return component;
  };

  it('defers the request stream until project users are loaded', () => {
    const component = createComponent() as any;

    component.getWsRequests$();

    expect(component.pendingWsRequestsLoad).toBe(true);
  });

  it('keeps remote participant lookups disabled when the bootstrap returns no users', () => {
    const component = createComponent() as any;
    component.pendingWsRequestsLoad = true;
    component.getWsRequests$ = jasmine.createSpy('getWsRequests$');
    component.usersService = {
      getProjectUsersByProjectId: jasmine.createSpy('getProjectUsersByProjectId').and.returnValue(of([]))
    };

    component.getAllProjectUsers();

    expect(component.projectUsersLoaded).toBe(true);
    expect(component.projectUsersLoadFailed).toBe(true);
    expect(component.projectUserArray).toEqual([]);
    expect(component.getWsRequests$).toHaveBeenCalledTimes(1);
  });

  it('releases one pending request load after the project user bootstrap', () => {
    const component = createComponent() as any;
    component.pendingWsRequestsLoad = true;
    component.projectUsersLoading = true;
    component.getWsRequests$ = jasmine.createSpy('getWsRequests$');

    component.finishProjectUsersLoad();
    component.finishProjectUsersLoad();

    expect(component.projectUsersLoaded).toBe(true);
    expect(component.projectUsersLoading).toBe(false);
    expect(component.projectUsersLoadFailed).toBe(false);
    expect(component.pendingWsRequestsLoad).toBe(false);
    expect(component.getWsRequests$).toHaveBeenCalledTimes(1);
  });

  it('releases the request stream in degraded mode when the user bootstrap fails', () => {
    const component = createComponent() as any;
    component.pendingWsRequestsLoad = true;
    component.projectUsersLoading = true;
    component.getWsRequests$ = jasmine.createSpy('getWsRequests$');

    component.finishProjectUsersLoad(false);

    expect(component.projectUsersLoaded).toBe(true);
    expect(component.projectUsersLoading).toBe(false);
    expect(component.projectUsersLoadFailed).toBe(true);
    expect(component.getWsRequests$).toHaveBeenCalledTimes(1);
  });
});
