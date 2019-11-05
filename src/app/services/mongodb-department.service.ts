// tslint:disable:max-line-length
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Department } from '../models/department-model';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
// import { MongodbConfService } from '../utils/mongodb-conf.service';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class DepartmentService {

  public myDepts_bs: BehaviorSubject<Department[]> = new BehaviorSubject<Department[]>([]);

  http: Http;

  // MONGODB_BASE_URL = environment.mongoDbConfig.DEPARTMENTS_BASE_URL;
  BASE_URL = environment.mongoDbConfig.BASE_URL;
  MONGODB_BASE_URL: any;
  MY_DEPTS_BASE_URL: any;
  // TOKEN =  environment.mongoDbConfig.TOKEN;
  TOKEN: string
  user: any;
  project: any;

  constructor(
    http: Http,
    // private mongodbConfService: MongodbConfService,
    private auth: AuthService
  ) {

    this.http = http;

    // this.MONGODB_BASE_URL = mongodbConfService.MONGODB_DEPARTMENTS_BASE_URL;
    // console.log('MONGODB_DEPARTMENTS_BASE_URL ! ', this.MONGODB_BASE_URL);
    // this.TOKEN = mongodbConfService.TOKEN;

    // SUBSCRIBE TO USER BS
    this.user = auth.user_bs.value
    this.checkUser()

    this.auth.user_bs.subscribe((user) => {
      this.user = user;
      this.checkUser()
    });

    this.getCurrentProject();
  }

  getCurrentProject() {
    console.log('DEPT SERVICE - SUBSCRIBE TO CURRENT PROJ ')
    // tslint:disable-next-line:no-debugger
    // debugger
    this.auth.project_bs.subscribe((project) => {
      this.project = project
      // tslint:disable-next-line:no-debugger
      // debugger
      if (this.project) {
        console.log('00 -> DEPT SERVICE project ID from AUTH service subscription  ', this.project._id);
        this.MONGODB_BASE_URL = this.BASE_URL + this.project._id + '/departments/'

        // FOR TEST - CAUSES ERROR WITH A NO VALID PROJECT ID
        // this.MONGODB_BASE_URL = this.BASE_URL + '5b3fa93a6f0537d8b01968fX' + '/departments/'
        this.MY_DEPTS_BASE_URL = this.BASE_URL + this.project._id + '/departments/mydepartments'
      }
    });
  }

  checkUser() {
    if (this.user) {
      this.TOKEN = this.user.token
      // this.getToken();
    } else {
      console.log('No user is signed in');
    }
  }

  /**
   **! *** GET DEPTS AS THE OLD WIDGET VERSION (USED YET BY SOME PROJECT) ***
   *  !!! USED ONLY FOR TESTING THE WIDGET CALLBACK
   *  * THAT GET THE DEPTS FILTERED FOR STATUS === 1 and WITHOUT AUTHENTICATION
   */
  // headers.append('Authorization', 'JWT [REDACTED_JWT]');
  // headers.append('Authorization', 'JWT [REDACTED_JWT]');
  public getMongDbDepartments(): Observable<Department[]> {
    const url = this.MONGODB_BASE_URL;
    // const url = `http://localhost:3000/app1/departments/`;
    // const url = `http://api.chat21.org/app1/departments/;
    console.log('GET DEPTS AS OLD WIDGET VERSION', url);
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  /**
   **! *** GET DEPTS AS THE NEW WIDGET VERSION ***
   */
  public getDepartmentsAsNewWidgetVersion(): Observable<Department[]> {
    const url = this.BASE_URL + this.project._id + '/widgets'
    console.log('GET DEPTS AS THE NEW WIDGET VERSION URL', url);
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }


    /**
   **! *** GET VISITOR COUNTER ***
   */
  public getVisitorCounter(): Observable<[]> {
    const url = this.BASE_URL + this.project._id + '/visitorcounter'
    console.log('GET DEPTS AS THE NEW WIDGET VERSION URL', url);
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }


  /**
   * GET ALL DEPTS WITH THE CURRENT PROJECT ID AND WITHOUT FILTER FOR STATUS
   * NOTE: THE CALLBACK TO GET THE DEPTS FILTERED FOR STATUS IS RUNNED BY THE WIDGET
   * NOTE: the DSBRD CALL /departments/allstatus  WHILE the WIDGET  CALL /departments
   * 
   * NOTE: chat21-api-node.js READ THE CURRENT PROJECT ID FROM THE URL SO IT SO NO LONGER NECESSARY TO PASS THE PROJECT ID AS PARAMETER
   */
  public getDeptsByProjectId(): Observable<Department[]> {
    const url = this.MONGODB_BASE_URL + 'allstatus';

    // const url = 'https://api.tiledesk.com/v1/5c28b587348b680015feecca/departments/'+'allstatus'
    console.log('DEPARTMENTS URL', url);
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    // tslint:disable-next-line:quotemark
    // headers.append('Authorization', "JWT [REDACTED_JWT]");
    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  // !!!! NO MORE USED - MOVED IN REQUEST SERVICE
  // // GET MY_DEPTS
  // public getMyDepts(): Observable<Department[]> {
  //   const url = this.MY_DEPTS_BASE_URL;
  //   // url += '?id_project=' + id_project;
  //   // this.BASE_URL + this.project._id + '/departments/mydepartments'

  //   console.log('MY DEPS URL', url);
  //   const headers = new Headers();
  //   headers.append('Content-Type', 'application/json');
  //   headers.append('Authorization', this.TOKEN);
  //   return this.http
  //     .get(url, { headers })
  //     .map((response) => response.json());
  // }

  // publishMyDepts() {
  //   this.getMyDepts().subscribe((depts: any) => {
  //     console.log('DEPTS SERV - MY DEPTS (publish)', depts);
  //     // PUBBLISH MY DEPTS
  //     this.myDepts_bs.next(depts);
  //   },
  //     (error) => {
  //       console.log('DEPTS SERV - MY DEPTS ', error);
  //     },
  //     () => {
  //       console.log('DEPTS SERV - MY DEPTS * COMPLETE *');
  //     });
  // }

  /**
   * READ DETAIL (GET BOT BY BOT ID)
   * @param id
   */
  public getMongDbDeptById(id: string): Observable<Department[]> {
    let url = this.MONGODB_BASE_URL;
    url += `${id}`;
    console.log('MONGO DB GET DEPT BY DEPT ID URL', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

  /**
   * CREATE (POST)
   * @param fullName
   */
  public addMongoDbDepartments(deptName: string, id_bot: string, bot_only: boolean, id_group: string, routing: string) {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    const body = { 'name': `${deptName}`, id_group: id_group, 'routing': `${routing}`, 'id_project': this.project._id };
    if (id_bot) {
      body['id_bot'] = id_bot;
      body['bot_only'] = bot_only;
    } else {
      body['id_bot'] = null;
      body['bot_only'] = null;
    }

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

    const url = this.MONGODB_BASE_URL + id;
    // url += `${id}# chat21-api-nodejs`; 
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
  public updateMongoDbDepartment(id: string, deptName: string, id_bot: string, bot_only: boolean, id_group: string, routing: string) {

    let url = this.MONGODB_BASE_URL;
    url += id;
    console.log('PUT URL ', url);

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    const body = { 'name': `${deptName}`, id_group: id_group, 'routing': `${routing}` };
    if (id_bot) {
      body['id_bot'] = id_bot;
      body['bot_only'] = bot_only;
    } else {
      body['id_bot'] = null;
      body['bot_only'] = null;
    }

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

  /**
   * UPDATE DEPARTMENT STATUS
   * @param dept_id
   * @param status
   */
  public updateDeptStatus(dept_id: string, status: number) {
    const url = this.MONGODB_BASE_URL + dept_id;
    console.log('UPDATE DEPT STATUS - URL ', url);
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    const body = { 'status': status };
    console.log('UPDATE DEPT STATUS - REQUEST BODY ', body);

    return this.http
      .put(url, JSON.stringify(body), options)
      .map((res) => res.json());
  }


  public updateDefaultDeptOnlineMsg(id: string, onlineMsg: string) {
    const url = this.MONGODB_BASE_URL + id;

    console.log('UPDATE DEFAULT DEPARTMENT URL  ', url);

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    const body = { 'online_msg': onlineMsg };

    console.log('UPDATE DEFAULT DEPARTMENT BODY  ', body);
    return this.http
      .put(url, JSON.stringify(body), options)
      .map((res) => res.json());

  }

  public updateDefaultDeptOfflineMsg(id: string, offlineMsg: string) {
    const url = this.MONGODB_BASE_URL + id;

    console.log('UPDATE DEFAULT DEPARTMENT URL  ', url);

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    const options = new RequestOptions({ headers });

    const body = { 'offline_msg': offlineMsg };

    console.log('UPDATE DEFAULT DEPARTMENT BODY  ', body);
    return this.http
      .put(url, JSON.stringify(body), options)
      .map((res) => res.json());

  }

  /**
   * READ DETAIL (TEST CHAT 21 router.get('/:departmentid/operators')
   * @param id
   */
  public testChat21AssignesFunction(id: string): Observable<Department[]> {
    let url = this.MONGODB_BASE_URL;
    // + '?nobot=' + true
    url += id + '/operators';
    console.log('-- -- -- URL FOR TEST CHAT21 FUNC ', url);

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', this.TOKEN);
    // console.log('TOKEN TO COPY ', this.TOKEN)
    return this.http
      .get(url, { headers })
      .map((response) => response.json());
  }

}
