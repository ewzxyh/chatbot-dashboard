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

  /**
   * READ (GET)
   */
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

  /**
   * CREATE (POST)
   * @param fullName
   */
  public addMongoDbContacts(fullName: string) {
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

  /**
   * DELETE (DELETE)
   * @param id
   */
  public deleteMongoDbContact(id: string) {

    let url = `http://localhost:3000/app1/contacts/`;
    url += `${id}# chat21-api-nodejs`;
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

  /**
   * UPDATE (PUT)
   * @param id
   * @param fullName
   */
  public updateMongoDbContact(id: string, fullName: string) {

    let url = `http://localhost:3000/app1/contacts/`;
    url = url += `${id}`;
    console.log('PUT URL ', url);

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', 'JWT [REDACTED_JWT]');
    const options = new RequestOptions({ headers });

    const body = { 'fullname': `${fullName}` };

    console.log('PUT REQUEST BODY ', body);

    this.http.put(url, JSON.stringify(body), options)
    .map((res) => res.json())
    .subscribe((data) => {
      console.log('PUT DATA ', data);
    },
    (error) => {

      console.log('PUT REQUEST ERROR ', error);

    },
    () => {
      console.log('PUT REQUEST * COMPLETE *');
    });

  }

}
