import { Injectable } from '@angular/core';
import { LoggerService } from './logger/logger.service';


@Injectable({
  providedIn: 'root'
})
export class SleekplanService {
  private sleekplanLoaded = false;
  private sleekplanLoadPromise: Promise<void> | null = null;
  private readonly defaultScriptUrl = 'https://client.sleekplan.com/sdk/e.js';
  constructor(
    private logger: LoggerService,
  ) { }

  isEnabled(): boolean {
    return window['CHATCASE_ENABLE_SLEEKPLAN'] === true;
  }

  waitForSleekplanReady(timeoutMs = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const startedAt = Date.now();

      const cleanup = () => {
        document.removeEventListener('sleek:widget_init', checkReady, false);
      };

      const checkReady = () => {
        if (resolved) {
          return;
        }

        if (window['$sleek'] && typeof window['$sleek'].open === 'function' && document.getElementById('sleek-widget')) {
          resolved = true;
          cleanup();
          resolve();
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          resolved = true;
          cleanup();
          reject(new Error('Sleekplan widget did not become ready'));
          return;
        }

        setTimeout(checkReady, 100);
      };

      document.addEventListener('sleek:widget_init', checkReady, false);
      checkReady();
    });
  }

  loadSleekplan(force = false): Promise<void> {
    this.logger.log('[SLEEKPLAN-SERV] - loadSleekplan ');
    return new Promise((resolve, reject) => {
      if (!force && !this.isEnabled()) {
        this.logger.log('[SLEEKPLAN-SERV] - disabled by ChatCase configuration');
        resolve();
        return;
      }

      const scriptUrl = window['CHATCASE_SLEEKPLAN_SCRIPT_URL'] || this.defaultScriptUrl;

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
        window['SLEEK_PRODUCT_ID'] = 869241497; // The good one product ID
        // window['SLEEK_PRODUCT_ID'] = 615248482 // for test

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


 
}
