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

@Injectable()
export class ContactsService {

  // Contact: Contact[];
  http: Http;
  projectId: string;
  user: any;
  TOKEN: any;
  currentUserID: string;

  BASE_URL = environment.mongoDbConfig.BASE_URL;
  MONGODB_BASE_URL = environment.mongoDbConfig.CONTACTS_BASE_URL;


  constructor(
    http: Http,
    public auth: AuthService

  ) {

    this.http = http;
    // this.MONGODB_BASE_URL = mongodbConfService.MONGODB_CONTACTS_BASE_URL;
    // console.log('MONGODB_CONTACTS_BASE_URL ! ', mongodbConfService.MONGODB_CONTACTS_BASE_URL);
    // this.TOKEN = mongodbConfService.TOKEN;
    this.getCurrentProject();

    this.user = auth.user_bs.value
    this.checkUser()

    this.auth.user_bs.subscribe((user) => {

      this.user = user;
      this.checkUser()
    });
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
  public getLeads(querystring, pagenumber): Observable<Contact[]> {
    let _querystring = '&' + querystring
    if (querystring === undefined || !querystring) {
      _querystring = ''
    }
    const url = this.BASE_URL + this.projectId + '/leads?page=' + pagenumber + _querystring;
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

  // GET LEADS
  public exportLeadToCsv(querystring, pagenumber) {
    let _querystring = '&' + querystring
    if (querystring === undefined || !querystring) {
      _querystring = ''
    }
    const url = this.BASE_URL + this.projectId + '/leads/csv?page=' + pagenumber + _querystring;
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
    const url = this.BASE_URL + this.projectId + '/leads/' + id;

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
  public updateLead(id: string, fullName: string, _email: string) {

    const url = this.BASE_URL + this.projectId + '/leads/' + id;

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

    const body = { 'fullname': fullName, 'email': _email };
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

    const url = this.BASE_URL + this.projectId + '/leads/' + id;

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
