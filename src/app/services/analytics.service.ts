import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from 'app/core/auth.service';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { URLSearchParams } from 'url';
@Injectable()
export class AnalyticsService {

  // baseURL = 'https://api.tiledesk.com/v1/';

  BASE_URL = environment.mongoDbConfig.BASE_URL;
  baseURL_local = 'http://localhost:3000/'
  ww='http://127.0.0.1:3000/'
  projectID: string;
  user: any;
  TOKEN: string;
  staticRemoteToken='JWT [REDACTED_JWT]'

  public richieste_bs: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(
    private http: HttpClient,
    public auth: AuthService
  ) {
    

    this.user = auth.user_bs.value
    this.checkUser()

    this.auth.user_bs.subscribe((user) => {
      this.user = user;
      this.checkUser()
    });


    this.getCurrentProject()
  }

  getCurrentProject() {
    console.log('============ PROJECT SERVICE - SUBSCRIBE TO CURRENT PROJ ============');
    // tslint:disable-next-line:no-debugger
    // debugger
    this.auth.project_bs.subscribe((project) => {
      console.log('AnalyticsService  project', project)
      if (project) {

        this.projectID = project._id;
        console.log('AnalyticsService ID PROJECT ', this.projectID);

      }
    });
  }

  checkUser() {
    if (this.user) {
      this.TOKEN = this.user.token
      // this.getToken();
      console.log('AnalyticsService user is signed in');
    } else {
      console.log('AnalyticsService No user is signed in');
    }
  }

  requestsByDay(lastdays, department_id): Observable<[]> {
       
    let headers= new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': this.TOKEN
       //'Authorization': this.staticRemoteToken, 
       //'Authorization': 'Basic ' + btoa('redacted@example.invalid:123456')
      });
    let params= new HttpParams()
                .set('lastdays', lastdays)
                .set('department_id', department_id);
    
    //const url = 'https://api.tiledesk.com/v1/'
    //return this.http.get<[]>('https://api.tiledesk.com/v1/' + this.projectID + '/analytics/requests/aggregate/day',{ headers:headers, params:params});
    return this.http.get<[]>(this.BASE_URL+ this.projectID + '/analytics/requests/aggregate/day' ,{ headers:headers, params:params})
    
  }


  getDataHeatMap(): Observable<[]> {

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
        //'Authorization': this.staticRemoteToken,
        //'Authorization': 'Basic ' + btoa('redacted@example.invalid:123456')
      })
    };
    //const url = 'https://api.tiledesk.com/v1/5ad5bd52c975820014ba900a'
    //return this.http.get<[]>('https://api.tiledesk.com/v1/' + this.projectID + '/analytics/requests/aggregate/dayoftheweek/hours', httpOptions);
    return this.http.get<[]>(this.BASE_URL + this.projectID+ '/analytics/requests/aggregate/dayoftheweek/hours', httpOptions);
   

  }

  getDataAVGWaitingCLOCK(): Observable<[]> {
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
        //'Authorization': this.staticRemoteToken,
       //'Authorization': 'Basic ' + btoa('redacted@example.invalid:123456')
      })
    };
    return this.http.get<[]>('https://api.tiledesk.com/v1/'+ this.projectID + '/analytics/requests/waiting', httpOptions);
    //return this.http.get<[]>(this.BASE_URL + this.projectID + '/analytics/requests/waiting', httpOptions);
  }

  getavarageWaitingTimeDataChart(): Observable<[]> {
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
        //'Authorization': this.staticRemoteToken,
        //'Authorization': 'Basic ' + btoa('redacted@example.invalid:123456')
      })
    };
   
    //return this.http.get<[]>('https://api.tiledesk.com/v1/'+ this.projectID + '/analytics/requests/waiting/day', httpOptions);
    return this.http.get<[]>(this.BASE_URL + this.projectID + '/analytics/requests/waiting/day', httpOptions);
  }

  getDurationConversationTimeDataCLOCK(): Observable<[]> {
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
        //'Authorization': this.staticRemoteToken,
        //'Authorization': 'Basic ' + btoa('redacted@example.invalid:123456')
      })
    };
   
    //return this.http.get<[]>('https://api.tiledesk.com/v1/'+this.projectID + '/analytics/requests/duration', httpOptions);
    return this.http.get<[]>(this.BASE_URL + this.projectID + '/analytics/requests/duration', httpOptions);
  }

  getDurationConversationTimeDataChart(): Observable<[]> {
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.TOKEN
        //'Authorization': this.staticRemoteToken,
        //'Authorization': 'Basic ' + btoa('redacted@example.invalid:123456')
      })
    };

    //return this.http.get<[]>('https://api.tiledesk.com/v1/'+ this.projectID + '/analytics/requests/duration/day', httpOptions);
    return this.http.get<[]>(this.BASE_URL + this.projectID + '/analytics/requests/duration/day', httpOptions);
  }

  goToRichieste(){
    this.richieste_bs.next("hasClickedNumberOfRequestLast7Days");
  }

}
