// tslint:disable:max-line-length
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Contact } from '../models/contact-model';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
@Injectable()
export class ContactsService {

  // Contact: Contact[];
  http: Http;

  constructor(http: Http) {
    this.http = http;
  }

  public getMongDbContacts(): Observable<Contact[]> {
    const url = `http://localhost:3000/app1/contacts`;
    // const url = `http://api.chat21.org/app1/contacts`;
    console.log('MONGO DB CONTACTS URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'JWT [REDACTED_JWT]');
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');
    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  public postMongoDbContacts(fullName: string) {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', 'JWT [REDACTED_JWT]');
    const options = new RequestOptions({ headers });

    const body = { 'fullname': `${fullName}` };

    console.log('POST REQUEST BODY ', body);

    const url = `http://localhost:3000/app1/contacts`;

    this.http.post(url, JSON.stringify(body), options)
      .map((res) => res.json())
      .subscribe((data) => {
        console.log('POST DATA ', data);
      },
      (error) => {

        console.log('POST REQUEST ERROR ', error);

      },
      () => {
        console.log('POST REQUEST * COMPLETE *');
      });
  }

  public deleteContact(id: string) {

    const url = `http://localhost:3000/app1/contacts/{id}# chat21-api-nodejs`;
    console.log('DELETE URL ', url);
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', 'JWT [REDACTED_JWT]');
    const options = new RequestOptions({ headers });

    this.http.delete(url, options)
      .map((res) => res.json())
      .subscribe((data) => {
        console.log('DELETE DATA ', data);
      },
      (error) => {

        console.log('DELETE REQUEST ERROR ', error);

      },
      () => {
        console.log('DELETE REQUEST * COMPLETE *');
      });
  }

}
