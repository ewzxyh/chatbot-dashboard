// tslint:disable:max-line-length
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Contact } from '../models/contact-model';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import { AuthService } from '../core/auth.service';
import { AppConfigService } from '../services/app-config.service';

import { WebSocketJs } from "./websocket/websocket-js";
import 'rxjs/add/observable/forkJoin';
import { LoggerService } from '../services/logger/logger.service';

@Injectable()
export class ContactsService {

  // Contact: Contact[];
  http: Http;
  projectId: string;
  user: any;
  TOKEN: any;
  currentUserID: string;

  SERVER_BASE_PATH: string;

  constructor(
    http: Http,
    public auth: AuthService,
    public appConfigService: AppConfigService,
    public webSocketJs: WebSocketJs,
    private logger: LoggerService

  ) {

    this.http = http;
    this.getCurrentProject();

    this.user = auth.user_bs.value
    this.checkUser()

    this.auth.user_bs.subscribe((user) => {

      this.user = user;
      this.checkUser()
    });

    this.getAppConfig();
  }

  getAppConfig() {
    this.SERVER_BASE_PATH = this.appConfigService.getConfig().SERVER_BASE_URL;
    this.logger.log('[CONTACTS-SERV] getAppConfig SERVER_BASE_PATH', this.SERVER_BASE_PATH);
  }

  getCurrentProject() {
    this.auth.project_bs.subscribe((project) => {
      // this.logger.log('[CONTACTS-SERV]: SUBSCRIBE TO THE PROJECT PUBLISHED BY AUTH SERVICE ', project)

      if (project) {
        this.projectId = project._id
      }
    })
  }

  checkUser() {
    if (this.user) {
      this.TOKEN = this.user.token
      this.currentUserID = this.user._id
      this.logger.log('[CONTACTS-SERV] - USER UID  ', this.currentUserID);
    } else {
      this.logger.log('No user is signed in');
    }
  }

  // -------------------------------
  // @ GET LEADS - ACTIVE OR TRASHED
  // -------------------------------
  public getLeadsActiveOrTrashed(querystring, pagenumber, hasclickedtrash): Observable<Contact[]> {
    let _querystring = '&' + querystring
    this.logger.log('[CONTACTS-SERV] - GET CONTACTS (ACTIVE OR TRASHED) hasclickedtrash', hasclickedtrash);
    this.logger.log('[CONTACTS-SERV] - GET CONTACTS (ACTIVE OR TRASHED) querystring', querystring);
    this.logger.log('[CONTACTS-SERV] - GET CONTACTS (ACTIVE OR TRASHED) pagenumber', pagenumber);

    if (querystring === undefined || !querystring) {
      _querystring = ''
    }

    let trashed_contacts = ''
    if (hasclickedtrash === true) {
      trashed_contacts = '&status=1000'
    }

    const url = this.SERVER_BASE_PATH + this.projectId + '/leads?page=' + pagenumber + _querystring + trashed_contacts;
    // use this to test
    // 5bcf51dbc375420015542b5f is the id og the project (in production ) progetto test 23 ott of the user redacted@example.invalid
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads?page=' + pagenumber + _querystring;
    this.logger.log('[CONTACTS-SERV] - GET CONTACTS (ACTIVE OR TRASHED) URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  // -------------------------------
  // @ GET LEADS - TRASHED
  // -------------------------------
  getLeadsTrashed(): Observable<Contact[]> {
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads?page=0&status=1000';
    // use this to test
    // 5bcf51dbc375420015542b5f is the id og the project (in production ) progetto test 23 ott of the user redacted@example.invalid
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads?page=' + pagenumber + _querystring;
    this.logger.log('[CONTACTS-SERV] - GET TRASHED CONTACTS URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  // -------------------------------
  // @ GET LEADS - ACTIVE
  // -------------------------------
  getLeadsActive(): Observable<Contact[]> {
    // const url = this.SERVER_BASE_PATH + this.projectId + '/leads?page=0';
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads';
    // use this to test
    // 5bcf51dbc375420015542b5f is the id og the project (in production ) progetto test 23 ott of the user redacted@example.invalid
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads?page=' + pagenumber + _querystring;
    this.logger.log('[CONTACTS-SERV] - GET ACIVE CONTACTS URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  // -------------------------------
  // @ GET LEADS WHIT LIMIT
  // -------------------------------
  getAllLeadsActiveWithLimit(limit): Observable<Contact[]> {
    // const url = this.SERVER_BASE_PATH + this.projectId + '/leads?page=0';
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads?limit=' + limit + '&with_fullname=true';
    // use this to test
    // 5bcf51dbc375420015542b5f is the id og the project (in production ) progetto test 23 ott of the user redacted@example.invalid
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads?page=' + pagenumber + _querystring;
    this.logger.log('[CONTACTS-SERV] - GET ACIVE CONTACTS WITH LIMIT URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  // ---------------------------------------------
  // @ Create new project user to get new lead ID
  // ---------------------------------------------
  public createNewProjectUserToGetNewLeadID() {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    const body = {};
    const url = this.SERVER_BASE_PATH + this.projectId + '/project_users/'
    this.logger.log('[CONTACTS-SERV] - CREATE NEW PROJECT USER TO GET NEW LEAD ID url ', url);
    return this.http
      .post(url, body, options)
      .map((res) => res.json());
  }

  // ---------------------------------------------
  // @ Create new lead 
  // ---------------------------------------------
  public createNewLead(leadid: string, fullname: string, leademail: string) {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    const body = { 'lead_id': leadid, 'fullname': fullname, 'email': leademail };

    this.logger.log('[CONTACTS-SERV] - CREATE NEW LEAD ', body);

    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/'

    return this.http
      .post(url, JSON.stringify(body), options)
      .map((res) => res.json());

  }

  // ---------------------------------------------
  // @ Export lead to CSV
  // ---------------------------------------------
  public exportLeadToCsv(querystring, pagenumber, hasclickedtrash) {
    let _querystring = '&' + querystring
    if (querystring === undefined || !querystring) {
      _querystring = ''
    }

    let trashed_contacts = ''
    if (hasclickedtrash === true) {
      trashed_contacts = '&status=1000'
    }
    // + trashed_contacts // IL SERVIZIO NON PRENDE I STATUS 1000
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/csv?page=' + pagenumber + _querystring;
    // use this to test
    // 5bcf51dbc375420015542b5f is the id og the project (in production ) progetto test 23 ott of the user redacted@example.invalid
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads?page=' + pagenumber + _querystring;
    this.logger.log('[CONTACTS-SERV] - EXPORT LEAD AS CSV URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/csv');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');
    return this.http
      .get(url, { headers })
      .map((response) => response.text());
  }


  // ---------------------------------------------
  // @ Get lead by id
  // ---------------------------------------------
  public getLeadById(id: string): Observable<Contact[]> {
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/' + id;

    /****** use this to test *******/
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads/' + id;
    this.logger.log('[CONTACTS-SERV] - GET LEAD BY ID URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  // ---------------------------------------------
  // @ Update lead
  // ---------------------------------------------
  public updateLead(
    id: string,
    fullName: string,
    lead_email: string,
    lead_company: string,
    lead_street_address: string,
    lead_city: string,
    lead_state: string,
    lead_postalcode: string,
    lead_country: string,
    lead_phone_number: string,
    lead_note: string
  ) {

    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/' + id;

    /****** use this to test *******/
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads/' + id;
    this.logger.log('[CONTACTS-SERV] UPDATE LEAD - URL ', url);

    const headers = new Headers();

    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');

    const options = new RequestOptions({ headers });

    const body = {
      'fullname': fullName,
      'email': lead_email,
      'company': lead_company,
      'streetAddress': lead_street_address,
      'city': lead_city,
      'region': lead_state,
      'zipcode': lead_postalcode,
      'country': lead_country,
      'phone': lead_phone_number,
      'note': lead_note
    };

    this.logger.log('[CONTACTS-SERV] UPDATE LEAD REQUEST - BODY ', body);
    return this.http
      .put(url, JSON.stringify(body), options)
      .map((res) => res.json());
  }

  // ---------------------------------------------
  // @ Delete lead
  // ---------------------------------------------
  public deleteLead(id: string) {
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/' + id;

    /****** use this to test *******/
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads/' + id;

    this.logger.log('[CONTACTS-SERV] DELETE LEAD - URL ', url);

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');
    const options = new RequestOptions({ headers });
    return this.http
      .delete(url, options)
      .map((res) => res.json());

  }

  // ---------------------------------------------
  // @ Delete lead from db
  // ---------------------------------------------
  public deleteLeadForever(id: string) {

    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/' + id + '/physical';

    /****** use this to test *******/
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads/' + id;

    this.logger.log('[CONTACTS-SERV] DELETE LEAD FOREVER - URL ', url);

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');
    const options = new RequestOptions({ headers });
    return this.http
      .delete(url, options)
      .map((res) => res.json());
  }


  // ---------------------------------------------
  // @ Restore lead
  // ---------------------------------------------
  public restoreLead(id: string) {
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/' + id;

    /****** use this to test *******/
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads/' + id;
    this.logger.log('[CONTACTS-SERV] - RESTORE LEAD - URL ', url);

    const headers = new Headers();

    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');

    const options = new RequestOptions({ headers });

    const body = { 'status': 100 };

    this.logger.log('[CONTACTS-SERV] - RESTORE LEAD - BODY ', body);
    return this.http
      .put(url, JSON.stringify(body), options)
      .map((res) => res.json());
  }

  // ---------------------------------------------
  // @ Get requests by requeste id
  // ---------------------------------------------
  public getRequestsByRequesterId(requesterid: string, pagenumber: number) {
    /* *** USED TO TEST IN LOCALHOST (note: this service doen't work in localhost) *** */
    // const url = 'https://api.tiledesk.com/v1/' + '5ba35f0b9acdd40015d350b6' + '/requests?requester_id=' + requesterid + '&page=' + pagenumber;
    /* *** USED IN PRODUCTION *** */
    const url = this.SERVER_BASE_PATH + this.projectId + '/requests?lead=' + requesterid + '&page=' + pagenumber + '&status=all' + '&no_populate=true';

    this.logger.log('[CONTACTS-SERV] - GET REQUESTS BY REQUESTER ID - URL ', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    /* *** USED TO TEST IN LOCALHOST (note: this service doesn't work in localhost) *** */
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');
    /* *** USED IN PRODUCTION *** */
    headers.append('Authorization', this.TOKEN);

    return this.http
      .get(url, { headers })
      // .map((response) => response.json());
      .map(
        (response) => {
          const data = response.json();
          // Does something on data.data
          this.logger.log('[CONTACTS-SERV] - GET REQUESTS BY REQUESTER ID * DATA * ', data);

          if (data.requests) {

            data.requests.forEach(request => {

              // ----------------------------------
              // @ Department
              // ----------------------------------
              if (request.snapshot && request.snapshot.department) {
                this.logger.log("[CONTACTS-SERV] - GET REQUESTS BY REQUESTER ID - snapshot department", request.snapshot.department);
                request.department = request['snapshot']["department"]

              } else if (request.department) {
                request.department = request.department
              }

            })
          }

          return data;
        })
  }

}
