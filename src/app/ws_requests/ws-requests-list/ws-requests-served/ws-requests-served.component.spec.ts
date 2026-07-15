import { Request } from '../../../models/request-model';
import { WsRequestsServedComponent } from './ws-requests-served.component';

describe('WsRequestsServedComponent pagination', () => {
  const createComponent = (): WsRequestsServedComponent => {
    const component = Object.create(WsRequestsServedComponent.prototype) as WsRequestsServedComponent;
    Object.assign(component, { pageSize: 25, pageIndex: 0, logger: { log: () => undefined } });
    return component;
  };

  it('keeps the DOM page at 25 requests and clamps navigation', () => {
    const component = createComponent();
    component.wsRequestsServed = Array.from({ length: 51 }, (_, index) => ({
      request_id: `request-${index}`
    } as Request));

    expect(component.visibleRequests.length).toBe(25);
    expect(component.totalPages).toBe(3);

    component.setPage(2);
    expect(component.visibleRequests.length).toBe(1);
    expect(component.visibleRequests[0].request_id).toBe('request-50');

    component.setPage(-1);
    expect(component.pageIndex).toBe(0);
  });

  it('tracks requests by their stable id', () => {
    const component = createComponent();
    const request = { request_id: 'request-1' } as Request;

    expect(component.trackByFn(0, request)).toBe('request-1');
  });

  it('preserves the current page across realtime updates and clamps removed pages', () => {
    const component = createComponent();
    component.pageIndex = 1;
    component.wsRequestsServed = Array.from({ length: 30 }, () => ({} as Request));

    component.ngOnChanges({ wsRequestsServed: {} as any });
    expect(component.pageIndex).toBe(1);

    component.wsRequestsServed = [{} as Request];
    component.ngOnChanges({ wsRequestsServed: {} as any });
    expect(component.pageIndex).toBe(0);
  });
});
