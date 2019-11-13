
import { Injectable } from '@angular/core';
import { Observable, Subject } from "rxjs/Rx";
import { WebSocketJs } from "./websocketjs";
import { AuthService } from '../../core/auth.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// const CHAT_URL = "ws://echo.websocket.org/";
const CHAT_URL = "ws://tiledesk-server-pre.herokuapp.com?token=JWT [REDACTED_JWT]";

export interface Message {
  action: string;
  payload: {
    topic: string,
    method: string, message: any
  };
}



@Injectable()

export class WsRequestsService {
  public messages: Subject<Message>;
  public wsRequestsList$: BehaviorSubject<[]> = new BehaviorSubject<[]>([]);

  wsRequestsList: any
  wsService: WebSocketJs;

  constructor(
    public auth: AuthService
  ) {

    console.log("HI WsRequestsService ");
    //this.wsConnect(); !no more used

    this.getWsRequests();
    this.getCurrentProject();

  }

  getWsRequests() {
    const self = this;
    self.wsRequestsList = []

    this.wsService = new WebSocketJs(
      CHAT_URL,

      function (data, notification) {

        console.log("% WsRequestsService create", data);


        // this.wsRequestsList.push(data);
        // self.addOrUpdateWsRequestsList(data);
        const hasFound = self.wsRequestsList.filter((obj: any) => {
          return obj._id === data._id;
        });

        console.log("%%%  WsRequestsService hasFound", hasFound);

        // console.log("% WsRequestsService create wsRequestsList ", self.wsRequestsList);
        // if (typeof self.wsRequestsList !== 'undefined' &&  self.wsRequestsList.length > 0 && self.wsRequestsList !== undefined) {
        //   let exists = this.wsRequestsList.some(request => request._id === data._id);
        //   console.log("% WsRequestsService create exists ", exists);
        // }

        if (hasFound.length === 0) {
          self.addWsRequest(data)
        } else {
          console.log("%%%  WsRequestsService hasFound - not add", hasFound);
        }

        // if() 


      }, function (data, notification) {

        console.log("% WsRequestsService update", data);
        // this.wsRequestsList.push(data);

        // self.addOrUpdateWsRequestsList(data);
        self.updateWsRequest(data)
      }
    );

    // if(this.wsRequestsList) {
    //   self.wsRequestsList$.next(this.wsRequestsList);
    // }

  }


  addWsRequest(request) {
    console.log("% WsRequestsService addWsRequest wsRequestsList.length", this.wsRequestsList.length);

    // for (let i = 0; i < this.wsRequestsList.length; i++) {
    //   if (request._id !== this.wsRequestsList[i]._id) {

    // this.wsRequestsList.forEach(r => {
    // console.log("% WsRequestsService addWsRequest r._id", r._id);
    console.log("% WsRequestsService addWsRequest request._id", request._id);
    // if (r._id !== request._id) {



    this.wsRequestsList.push(request);



    // if (this.wsRequestsList.length === 0) {

    //   

    // } else {

    //   // this.wsRequestsList.forEach(r => {

    //     // if (r._id !== request._id) {
    //       this.wsRequestsList.push(request);
    //     // }

    //   // });

    // }



    if (this.wsRequestsList) {
      this.wsRequestsList$.next(this.wsRequestsList);
    }
  }


  updateWsRequest(request) {
    for (let i = 0; i < this.wsRequestsList.length; i++) {

      if (request._id === this.wsRequestsList[i]._id) {
        console.log("% WsRequestsService getWsRequests UPATE AN EXISTING REQUESTS - request._id : ", request._id, ' wsRequestsList[i]._id: ', this.wsRequestsList[i]._id);
        /// UPATE AN EXISTING REQUESTS
        this.wsRequestsList[i] = request

        if (this.wsRequestsList) {
          this.wsRequestsList$.next(request);
        }
      }
    }
  }

  addOrUpdateWsRequestsList(request) {
    console.log("% WsRequestsService getWsRequests addOrUpdateWsRequestsList: ", request);
    for (let i = 0; i < this.wsRequestsList.length; i++) {
      if (request._id === this.wsRequestsList[i]._id) {
        console.log("% WsRequestsService getWsRequests UPATE AN EXISTING REQUESTS - request._id : ", request._id, ' wsRequestsList[i]._id: ', this.wsRequestsList[i]._id);
        /// UPATE AN EXISTING REQUESTS
        this.wsRequestsList[i] = request

      } else {

        this.wsRequestsList.push(request);
      }
    }

    this.wsRequestsList$.next(this.wsRequestsList);
  }


  getCurrentProject() {

    // IF EXIST A PROJECT UNSUSCRIBE query.onSnapshot AND RESET REQUEST LIST
    this.auth.project_bs.subscribe((project) => {
      console.log('!!! REQUEST SERVICE: SUBSCRIBE TO THE PROJECT PUBLISHED BY AUTH SERVICE ', project)
      // // tslint:disable-next-line:no-debugger
      // debugger
      if (project) {

        /**
         ***** UNCOMMENT THIS TO START WEBSOCKET ****** 
         */
        this.subscribeToWebsocket(project._id)
      }

    });
  }

  subscribeToWebsocket(project_id) {

    var message = {
      action: 'subscribe',
      payload: {
        topic: '/' + project_id + '/requests',
        // topic: '/' + project_id + '/requests/support-group-LtOiA7nku6c9Ho0rUfa/messages/',
        message: undefined,
        method: undefined
      },
    };
    var str = JSON.stringify(message);
    console.log("%% str " + str);
    this.wsService.start(str);

    // this.messages.next(message);
    console.log("%% subscribeToWebsocket new message from client to websocket  this.messages: ", this.messages);
    console.log("%% subscribeToWebsocket new message from client to websocket: ", message);

  }



  getWsRequests_old() {
    this.wsRequestsList = []
    this.messages.subscribe(json => {
      console.log("% WsRequestsService getWsRequests (Response from websocket) json : ", json);

      if (json) {
        const wsresponse = json
        const wsmethod = wsresponse['payload']['method'];

        // this.wsRequestsList$.next(this.wsRequestsList);


        console.log("% WsRequestsService getWsRequests (Response from websocket) wsmethod: ", wsmethod);
        console.log("% WsRequestsService getWsRequests (Response from websocket) wsRequestsList: ", this.wsRequestsList);
        //hai array di richieste iniziali 


        wsresponse['payload']['message'].forEach(request => {

          this.addOrUpdateWsRequestsList(request);

        });

      }

    });
  }



  // wsConnectOld() {
  //   console.log('%% HI WsRequestsService! - wsService ')
  //   this.messages = <Subject<Message>>this.wsService.connect(CHAT_URL).map(
  //     (response: MessageEvent): Message => {
  //       console.log('%% WsRequestsService response ', response)
  //       let data = JSON.parse(response.data);
  //       return data;
  //       // return {
  //       //   action: data.action,
  //       //   payload: data.payload.topic
  //       // };

  //     }
  //   );
  // }


  // topic: '/5dc924a13fa2b8001798b9c1/requests',






}



