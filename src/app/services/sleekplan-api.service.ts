import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoggerService } from './logger/logger.service';
@Injectable({
  providedIn: 'root'
})

export class SleekplanApiService {
 SLEEKPLAN_API_KEY = 'REDACTED_SECRET'; // The good one
//  SLEEKPLAN_API_KEY = 'REDACTED_SECRET'; // for test
 SLEEKPLAN_API_URL = 'https://api.sleekplan.com/v1/updates';

  constructor(
    private httpClient: HttpClient,
    private logger: LoggerService,
  ) { }


  getNewChangelogCount() {
    const httpOptions = {
      headers: new HttpHeaders({ 
        Authorization: `Bearer ${this.SLEEKPLAN_API_KEY}`,
        'Content-Type': 'application/json',
      })
    };
    

    const url = this.SLEEKPLAN_API_URL + '?per_page=1'
    this.logger.log('[SLEEKPLAN-SERVICE] - get last changelog');

    return this.httpClient.get(url, httpOptions);
  }


}
