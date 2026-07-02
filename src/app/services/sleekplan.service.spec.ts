import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { SleekplanService } from './sleekplan.service';
import { LoggerService } from './logger/logger.service';
import { AppConfigService } from './app-config.service';

describe('SleekplanService', () => {
  let service: SleekplanService;
  let remoteConfig: any;

  beforeEach(() => {
    remoteConfig = {};
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { log: () => { }, error: () => { } } },
        { provide: AppConfigService, useValue: { getConfig: () => remoteConfig } }
      ]
    });
    service = TestBed.inject(SleekplanService);
  });

  afterEach(() => {
    delete window['$sleek'];
    delete window['SLEEK_PRODUCT_ID'];
    delete window['CHATCASE_ENABLE_SLEEKPLAN'];
    delete window['CHATCASE_SLEEKPLAN_PRODUCT_ID'];
    delete window['SLEEK_SETTINGS'];
    document.getElementById('sleek-widget')?.remove();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should accept boolean and string values for the enable flag', () => {
    expect(service.isEnabled()).toBe(false);

    window['CHATCASE_ENABLE_SLEEKPLAN'] = true;
    expect(service.isEnabled()).toBe(true);

    window['CHATCASE_ENABLE_SLEEKPLAN'] = 'true';
    expect(service.isEnabled()).toBe(true);
  });

  it('should accept the enable flag from remote config', () => {
    remoteConfig.chatcaseSleekplanEnabled = 'true';

    expect(service.isEnabled()).toBe(true);
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
    expect(window['SLEEK_PRODUCT_ID']).toBe(937918520);
    expect(resolved).toBe(true);
  }));

  it('should allow ChatCase to configure the Sleekplan product id', fakeAsync(() => {
    window['CHATCASE_SLEEKPLAN_PRODUCT_ID'] = 123456789;
    spyOn(document.head, 'appendChild').and.callFake((node: Node) => {
      setTimeout(() => {
        const script = node as HTMLScriptElement;
        if (script.onload) {
          script.onload(new Event('load') as any);
        }
      });
      return node;
    });

    service.loadSleekplan(true);
    tick();

    expect(window['SLEEK_PRODUCT_ID']).toBe(123456789);
  }));

  it('should wait until the Sleekplan SDK init event is fired', fakeAsync(() => {
    let resolved = false;
    service.waitForSleekplanReady().then(() => resolved = true);

    window['$sleek'] = { open: () => { } };
    tick(100);
    expect(resolved).toBe(false);

    document.dispatchEvent(new Event('sleek:init'));
    tick(100);

    expect(resolved).toBe(true);
  }));
});
