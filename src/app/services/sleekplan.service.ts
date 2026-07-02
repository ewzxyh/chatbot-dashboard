import { Injectable } from '@angular/core';
import { LoggerService } from './logger/logger.service';
import { AppConfigService } from './app-config.service';


@Injectable({
  providedIn: 'root'
})
export class SleekplanService {
  private sleekplanLoaded = false;
  private sleekplanReady = false;
  private sleekplanInitListenerBound = false;
  private sleekplanLoadPromise: Promise<void> | null = null;
  private readonly defaultProductId = 937918520;
  private readonly defaultScriptUrl = 'https://client.sleekplan.com/sdk/e.js';
  constructor(
    private logger: LoggerService,
    private appConfigService: AppConfigService,
  ) { }

  isEnabled(): boolean {
    const enabled = window['CHATCASE_ENABLE_SLEEKPLAN'] || this.getConfigValue('chatcaseSleekplanEnabled');
    return enabled === true || enabled === 'true';
  }

  waitForSleekplanReady(timeoutMs = 10000): Promise<void> {
    this.bindSleekplanInitListener();

    if (this.sleekplanReady) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let resolved = false;
      const startedAt = Date.now();

      const checkReady = () => {
        if (resolved) {
          return;
        }

        if (this.sleekplanReady) {
          resolved = true;
          resolve();
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          resolved = true;
          reject(new Error('Sleekplan widget did not become ready'));
          return;
        }

        setTimeout(checkReady, 100);
      };

      checkReady();
    });
  }

  loadSleekplan(force = false): Promise<void> {
    this.logger.log('[SLEEKPLAN-SERV] - loadSleekplan ');
    return new Promise((resolve, reject) => {
      this.bindSleekplanInitListener();

      if (!force && !this.isEnabled()) {
        this.logger.log('[SLEEKPLAN-SERV] - disabled by ChatCase configuration');
        resolve();
        return;
      }

      const scriptUrl = window['CHATCASE_SLEEKPLAN_SCRIPT_URL'] || this.getConfigValue('chatcaseSleekplanScriptUrl') || this.defaultScriptUrl;

      if (this.sleekplanLoaded) {
        resolve();
        return;
      }

      if (this.sleekplanLoadPromise) {
        this.sleekplanLoadPromise.then(resolve).catch(reject);
        return;
      }

      this.sleekplanLoadPromise = new Promise((loadResolve, loadReject) => {
        // Configure Sleekplan product ID
        const currentSettings = window['SLEEK_SETTINGS'] || {};
        window['SLEEK_SETTINGS'] = {
          ...currentSettings,
          session: {
            ...(currentSettings.session || {}),
            skip_announcements: true
          }
        };
        window['$sleek'] = window['$sleek'] || [];
        window['SLEEK_PRODUCT_ID'] = window['CHATCASE_SLEEKPLAN_PRODUCT_ID'] || this.getConfigValue('chatcaseSleekplanProductId') || this.defaultProductId;

        // Dynamically load the Sleekplan script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = scriptUrl;
        script.async = true;

        script.onload = () => {
          this.sleekplanLoaded = true;
          this.logger.log('[SLEEKPLAN-SERV] - Sleekplan script loaded successfully');
          loadResolve();
        };

        script.onerror = (error) => {
          this.sleekplanLoadPromise = null;
          this.logger.error('[SLEEKPLAN-SERV] - Failed to load Sleekplan script', error);
          loadReject(error);
        };

        document.head.appendChild(script);
      });

      this.sleekplanLoadPromise.then(resolve).catch(reject);
     
    });
  }

  private bindSleekplanInitListener(): void {
    if (this.sleekplanInitListenerBound) {
      return;
    }

    this.sleekplanInitListenerBound = true;
    document.addEventListener('sleek:init', () => {
      this.sleekplanReady = true;
    }, false);
  }

  private getConfigValue(key: string): any {
    const value = this.appConfigService.getConfig()?.[key];
    return typeof value === 'string' && value.indexOf('${') === 0 ? null : value;
  }


 
}
