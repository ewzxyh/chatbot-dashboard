import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { SleekplanService } from './sleekplan.service';
import { LoggerService } from './logger/logger.service';

describe('SleekplanService', () => {
  let service: SleekplanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { log: () => { }, error: () => { } } }
      ]
    });
    service = TestBed.inject(SleekplanService);
  });

  afterEach(() => {
    delete window['$sleek'];
    delete window['SLEEK_PRODUCT_ID'];
    delete window['SLEEK_SETTINGS'];
    document.getElementById('sleek-widget')?.remove();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should skip automatic announcements when loading the widget', fakeAsync(() => {
    let resolved = false;
    spyOn(document.head, 'appendChild').and.callFake((node: Node) => {
      setTimeout(() => {
        const script = node as HTMLScriptElement;
        if (script.onload) {
          script.onload(new Event('load') as any);
        }
      });
      return node;
    });

    service.loadSleekplan(true).then(() => resolved = true);
    tick();

    expect(window['SLEEK_SETTINGS'].session.skip_announcements).toBe(true);
    expect(resolved).toBe(true);
  }));

  it('should wait until the Sleekplan API is ready', fakeAsync(() => {
    let resolved = false;
    service.waitForSleekplanReady().then(() => resolved = true);

    window['$sleek'] = { open: () => { } };
    tick(100);

    expect(resolved).toBe(true);
  }));
});
