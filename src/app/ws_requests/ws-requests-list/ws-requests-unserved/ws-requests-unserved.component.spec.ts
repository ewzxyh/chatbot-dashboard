import { Request } from '../../../models/request-model';
import { WsRequestsUnservedComponent } from './ws-requests-unserved.component';

describe('WsRequestsUnservedComponent pagination', () => {
  const createComponent = (): WsRequestsUnservedComponent => {
    const component = Object.create(WsRequestsUnservedComponent.prototype) as WsRequestsUnservedComponent;
    Object.assign(component, { pageSize: 25, pageIndex: 0, logger: { log: () => undefined } });
    return component;
  };

  it('keeps the DOM page at 25 requests and clamps navigation', () => {
    const component = createComponent();
    component.wsRequestsUnserved = Array.from({ length: 26 }, (_, index) => ({
      request_id: `request-${index}`
    } as Request));

    expect(component.visibleRequests.length).toBe(25);
    expect(component.totalPages).toBe(2);

    component.setPage(1);
    expect(component.visibleRequests.length).toBe(1);
    expect(component.visibleRequests[0].request_id).toBe('request-25');

    component.setPage(99);
    expect(component.pageIndex).toBe(1);
  });

  it('tracks requests by their stable id', () => {
    const component = createComponent();
    const request = { request_id: 'request-1' } as Request;

    expect(component.trackByFn(0, request)).toBe('request-1');
  });

  it('preserves the current page across realtime updates and clamps removed pages', () => {
    const component = createComponent();
    component.pageIndex = 1;
    component.wsRequestsUnserved = Array.from({ length: 30 }, () => ({} as Request));

    component.ngOnChanges({ wsRequestsUnserved: {} as any });
    expect(component.pageIndex).toBe(1);

    component.wsRequestsUnserved = [{} as Request];
    component.ngOnChanges({ wsRequestsUnserved: {} as any });
    expect(component.pageIndex).toBe(0);
  });
});
