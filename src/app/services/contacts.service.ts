// tslint:disable:max-line-length
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Contact } from '../models/contact-model';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
// import { MongodbConfService } from '../utils/mongodb-conf.service';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import { AppConfigService } from '../services/app-config.service';

@Injectable()
export class ContactsService {

  // Contact: Contact[];
  http: Http;
  projectId: string;
  user: any;
  TOKEN: any;
  currentUserID: string;

  // BASE_URL = environment.mongoDbConfig.BASE_URL; // replaced with SERVER_BASE_PATH
  // SERVER_BASE_PATH = environment.SERVER_BASE_URL; // now get from appconfig
  SERVER_BASE_PATH: string;

  constructor(
    http: Http,
    public auth: AuthService,
    public appConfigService: AppConfigService

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
    console.log('AppConfigService getAppConfig (CONTACTS-SERV) SERVER_BASE_PATH', this.SERVER_BASE_PATH);
  }

  getCurrentProject() {
    this.auth.project_bs.subscribe((project) => {
      console.log('!!!! CONTACTS SERVICE: SUBSCRIBE TO THE PROJECT PUBLISHED BY AUTH SERVICE ', project)

      if (project) {
        this.projectId = project._id
      }
    })
  }

  checkUser() {
    if (this.user) {
      this.TOKEN = this.user.token
      this.currentUserID = this.user._id
      console.log('!!!! CONTACTS SERVICE - USER UID  ', this.currentUserID);
    } else {
      console.log('No user is signed in');
    }
  }

  // GET LEADS
  public getLeadsActiveOrTrashed(querystring, pagenumber, hasclickedtrash): Observable<Contact[]> {
    let _querystring = '&' + querystring
    console.log('!!!! CONTACTS SERVICE - GET CONTACTS hasclickedtrashL', hasclickedtrash);

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
    console.log('!!!! CONTACTS SERVICE - GET CONTACTS URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  getLeadsTrashed(): Observable<Contact[]> {
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads?page=0&status=1000';
    // use this to test
    // 5bcf51dbc375420015542b5f is the id og the project (in production ) progetto test 23 ott of the user redacted@example.invalid
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads?page=' + pagenumber + _querystring;
    console.log('!!!! CONTACTS SERVICE - GET TRASHED CONTACTS URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  getLeadsActive(): Observable<Contact[]> {
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads?page=0';
    // use this to test
    // 5bcf51dbc375420015542b5f is the id og the project (in production ) progetto test 23 ott of the user redacted@example.invalid
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads?page=' + pagenumber + _querystring;
    console.log('!!!! CONTACTS SERVICE - GET ACIVE CONTACTS URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }


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
    console.log('!!!! CONTACTS SERVICE - GET CONTACTS URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/csv');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');
    return this.http
      .get(url, { headers })
      .map((response) => response.text());
  }




  // GET LEAD BY ID
  public getLeadById(id: string): Observable<Contact[]> {
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/' + id;

    /****** use this to test *******/
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads/' + id;
    console.log('!!!! CONTACTS SERVICE - GET CONTACT BY ID URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  /**
   * UPDATE (PUT)
   * @param id
   * @param fullName
   */
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
    console.log('UPDATE CONTACT URL ', url);

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
    // const body = {};
    // if (fullName) {
    //   body['fullname'] = fullName
    // }
    // if (email) {
    //   body['email'] = email
    // }

    console.log('UPDATE CONTACT REQUEST BODY ', body);
    return this.http
      .put(url, JSON.stringify(body), options)
      .map((res) => res.json());
  }

  /**
   * DELETE (DELETE)
   * @param id
   */
  public deleteLead(id: string) {
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/' + id;

    /****** use this to test *******/
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads/' + id;

    console.log('DELETE URL ', url);

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

  /**
 * DELETE (DELETE)
 * @param id
 */
  public deleteLeadForever(id: string) {

    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/' + id + '/physical';

    /****** use this to test *******/
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads/' + id;

    console.log('DELETE LEAD FOREVER URL ', url);

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

  public restoreContact(id: string) {
    const url = this.SERVER_BASE_PATH + this.projectId + '/leads/' + id;

    /****** use this to test *******/
    // const url = 'https://api.tiledesk.com/v1/5bcf51dbc375420015542b5f/leads/' + id;
    console.log('UPDATE CONTACT URL ', url);

    const headers = new Headers();

    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);

    /****** use this to test *******/
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');

    const options = new RequestOptions({ headers });
    
    const body = { 'status': 100, };

    console.log('UPDATE CONTACT REQUEST BODY ', body);
    return this.http
      .put(url, JSON.stringify(body), options)
      .map((res) => res.json());

  }

  public getNodeJsRequestsByRequesterId(requesterid: string, pagenumber: number) {
    /* *** USED TO TEST IN LOCALHOST (note: this service doen't work in localhost) *** */
    // const url = 'https://api.tiledesk.com/v1/' + '5ba35f0b9acdd40015d350b6' + '/requests?requester_id=' + requesterid + '&page=' + pagenumber;
    /* *** USED IN PRODUCTION *** */
    const url = this.SERVER_BASE_PATH + this.projectId + '/requests?lead=' + requesterid + '&page=' + pagenumber;

    console.log('!!!! CONTACT DETAILS - REQUESTS SERVICE URL ', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    /* *** USED TO TEST IN LOCALHOST (note: this service doesn't work in localhost) *** */
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');
    /* *** USED IN PRODUCTION *** */
    headers.append('Authorization', this.TOKEN);

    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }


  /**
   * CREATE (POST)
   * @param fullName
   */
  // public addMongoDbContacts(fullName: string) {
  //   const headers = new Headers();
  //   headers.append('Accept', 'application/json');
  //   headers.append('Content-type', 'application/json');
  //   headers.append('Authorization', this.TOKEN);
  //   const options = new RequestOptions({ headers });

  //   const body = { 'fullname': `${fullName}` };

  //   console.log('POST REQUEST BODY ', body);

  //   const url = this.MONGODB_BASE_URL;

  //   return this.http
  //     .post(url, JSON.stringify(body), options)
  //     .map((res) => res.json());
  // }





}
