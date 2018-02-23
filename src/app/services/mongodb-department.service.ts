// tslint:disable:max-line-length
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Department } from '../models/department-model';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
// import { MongodbConfService } from '../utils/mongodb-conf.service';
import { environment } from '../../environments/environment';

@Injectable()
export class MongodbDepartmentService {

  http: Http;

  // MONGODB_BASE_URL: any;
  // TOKEN: any;
  MONGODB_BASE_URL = environment.mongoDbConfig.MONGODB_DEPARTMENTS_BASE_URL;
  TOKEN =  environment.mongoDbConfig.TOKEN;

  constructor(
    http: Http,
    // private mongodbConfService: MongodbConfService,
  ) {

    this.http = http;

    // this.MONGODB_BASE_URL = mongodbConfService.MONGODB_DEPARTMENTS_BASE_URL;
    // console.log('MONGODB_DEPARTMENTS_BASE_URL ! ', this.MONGODB_BASE_URL);
    // this.TOKEN = mongodbConfService.TOKEN;
  }

  /**
   * READ (GET)
   */
  public getMongDbDepartments(): Observable<Department[]> {
    const url = this.MONGODB_BASE_URL;
    // const url = `http://localhost:3000/app1/contacts`;
    // const url = `http://api.chat21.org/app1/contacts`;
    console.log('MONGO DB DEPARTMENTS URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');
    // headers.append('Authorization', 'JWT [REDACTED_JWT]');
    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  /**
   * CREATE (POST)
   * @param fullName
   */
  public addMongoDbDepartments(deptName: string) {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    const body = { 'name': `${deptName}` };

    console.log('POST REQUEST BODY ', body);

    const url = this.MONGODB_BASE_URL;

    return this.http
      .post(url, JSON.stringify(body), options)
      .map((res) => res.json());
    // .subscribe((data) => {
    //   console.log('POST DATA ', data);
    // },
    // (error) => {

    //   console.log('POST REQUEST ERROR ', error);

    // },
    // () => {
    //   console.log('POST REQUEST * COMPLETE *');
    // });
  }

  /**
   * DELETE (DELETE)
   * @param id
   */
  public deleteMongoDbDeparment(id: string) {

    let url = this.MONGODB_BASE_URL;
    url += `${id}# chat21-api-nodejs`;
    console.log('DELETE URL ', url);

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    return this.http
      .delete(url, options)
      .map((res) => res.json());
    // .subscribe((data) => {
    //   console.log('DELETE DATA ', data);
    // },
    // (error) => {

    //   console.log('DELETE REQUEST ERROR ', error);

    // },
    // () => {
    //   console.log('DELETE REQUEST * COMPLETE *');
    // });
  }

  /**
   * UPDATE (PUT)
   * @param id
   * @param deptName
   */
  public updateMongoDbDepartment(id: string, deptName: string) {

    let url = this.MONGODB_BASE_URL;
    url = url += `${id}`;
    console.log('PUT URL ', url);

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    const body = { 'name': `${deptName}` };

    console.log('PUT REQUEST BODY ', body);

    return this.http
      .put(url, JSON.stringify(body), options)
      .map((res) => res.json());
      // .subscribe((data) => {
      //   console.log('PUT DATA ', data);
      // },
      // (error) => {

      //   console.log('PUT REQUEST ERROR ', error);

      // },
      // () => {
      //   console.log('PUT REQUEST * COMPLETE *');
      // });

  }

}
