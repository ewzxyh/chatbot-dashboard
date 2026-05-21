import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoggerService } from './logger/logger.service';
import { BehaviorSubject, of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})

export class SleekplanApiService {
 public hasOpenedChangelogfromPopup$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  constructor(
    private httpClient: HttpClient,
    private logger: LoggerService,
  ) { }

  isEnabled(): boolean {
    return window['CHATCASE_ENABLE_SLEEKPLAN'] === true;
  }

  getNewChangelogCount() {
    if (!this.isEnabled()) {
      this.logger.log('[SLEEKPLAN-SERVICE] - changelog disabled by ChatCase configuration');
      return of({ data: { items: {} } });
    }

    const apiKey = window['CHATCASE_SLEEKPLAN_API_KEY'];
    const apiUrl = window['CHATCASE_SLEEKPLAN_API_URL'];
    if (!apiKey || !apiUrl) {
      this.logger.log('[SLEEKPLAN-SERVICE] - missing ChatCase Sleekplan API configuration');
      return of({ data: { items: {} } });
    }

    const httpOptions = {
      headers: new HttpHeaders({ 
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',  
        'Pragma': 'no-cache'  
      })
    };
    

    const url = apiUrl + '?per_page=1'
    this.logger.log('[SLEEKPLAN-SERVICE] - get last changelog');

    return this.httpClient.get(url, httpOptions);
  }

  hasOpenedSPChangelogFromPopup() {
    this.hasOpenedChangelogfromPopup$.next(true)
  }


}
