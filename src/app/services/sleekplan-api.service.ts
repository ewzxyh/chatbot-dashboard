import { Injectable } from '@angular/core';
import { LoggerService } from './logger/logger.service';
import { BehaviorSubject, of } from 'rxjs';
import { AppConfigService } from './app-config.service';
@Injectable({
  providedIn: 'root'
})

export class SleekplanApiService {
 public hasOpenedChangelogfromPopup$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  constructor(
    private logger: LoggerService,
    private appConfigService: AppConfigService,
  ) { }

  isEnabled(): boolean {
    const enabled = window['CHATCASE_ENABLE_SLEEKPLAN'] || this.getConfigValue('chatcaseSleekplanEnabled');
    return enabled === true || enabled === 'true';
  }

  getNewChangelogCount() {
    if (!this.isEnabled()) {
      this.logger.log('[SLEEKPLAN-SERVICE] - changelog disabled by ChatCase configuration');
      return of({ data: { items: {} } });
    }

    this.logger.log('[SLEEKPLAN-SERVICE] - changelog API disabled in browser');
    return of({ data: { items: {} } });
  }

  hasOpenedSPChangelogFromPopup() {
    this.hasOpenedChangelogfromPopup$.next(true)
  }

  private getConfigValue(key: string): any {
    const value = this.appConfigService.getConfig()?.[key];
    return typeof value === 'string' && value.indexOf('${') === 0 ? null : value;
  }


}
