// // import { Injectable } from '@angular/core';

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class WsRequestsService {

// //   constructor() { }
// // }

// import { Injectable } from '@angular/core';
// import { Observable, Subject } from "rxjs/Rx";
// import { WebsocketService } from "./websocket.service";
// import { AuthService } from '../core/auth.service';
// import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// // const CHAT_URL = "ws://echo.websocket.org/";
// const CHAT_URL = "ws://tiledesk-server-pre.herokuapp.com?token=JWT [REDACTED_JWT]";

// export interface Message {
//   action: string;
//   payload: {
//     topic: string,
//     method: string, message: any
//   };
// }

// // {
// //   action: 'subscribe',
// //   payload: {
// //     topic: 'topic1',
// //   },
// // }

// @Injectable()


// export class WsRequestsService {
//   public messages: Subject<Message>;
//   public wsRequestsList$: BehaviorSubject<[]> = new BehaviorSubject<[]>([]);

//   wsRequestsList: any;

//   constructor(
//     public wsService: WebsocketService,
//     public auth: AuthService
//   ) {

//     this.wsConnect();

//     this.getWsRequests();

//     this.getCurrentProject();

//   }

//   getWsRequests() {
//     this.wsRequestsList = []
//     this.messages.subscribe(json => {
//       console.log("% WsRequestsService getWsRequests (Response from websocket) json : ", json);

//       if (json) {
//         const wsresponse = json
//         const wsmethod = wsresponse['payload']['method'];

//         // this.wsRequestsList$.next(this.wsRequestsList);
       

//         console.log("% WsRequestsService getWsRequests (Response from websocket) wsmethod: ", wsmethod);
//         console.log("% WsRequestsService getWsRequests (Response from websocket) wsRequestsList: ", this.wsRequestsList);
//         //hai array di richieste iniziali 


//         wsresponse['payload']['message'].forEach(request => {
          
//           this.addOrUpdateWsRequestsList(request);

//         });

//       }



//       //   if (json && json.payload  && json.payload.message && this.isArray(json.payload.message)) {
//       //     json.payload.message.forEach(element => {
//       //        // console.log("element", element);
//       //         //let insUp = that.insertOrUpdate(element);
//       //       let insUp = json.payload.method;
//       //     console.log("insUp",insUp);

//       //         // var object = {event: json.payload, data: element};
//       //         if (insUp=="CREATE" ) {
//       //               //create 
//       //           }
//       //           if (insUp=="UPDATE" ) {
//       //             //update 
//       //           }

//       //         // if (insUp=="CREATE" && that.onCreate) {
//       //         //     that.onCreate(element, object);
//       //         // }
//       //         // if (insUp=="UPDATE" && that.onUpdate) {
//       //         //     that.onUpdate(element, object);
//       //         // }
//       //         // //this.data.push(element);

//       //         //  resolve(element, object);
//       //         // $('#messages').after(element.text + '<br>');
//       //     });
//       // }else {
//       //     //let insUp = that.insertOrUpdate(json.payload.message);
//       //     let insUp = json.payload.method;                                                                                                                                                                                                                         
//       //       console.log("insUp",insUp);     

//       //     var object = {event: json.payload, data: json};

//       //     if (insUp=="CREATE" && that.onCreate) {
//       //         that.onCreate(json.payload.message, object);
//       //     }
//       //     if (insUp=="UPDATE" && that.onUpdate) {
//       //         that.onUpdate(json.payload.message, object);
//       //     }
//       //      resolve(json.payload.message, object);
//       //     // resolve
//       //     // $('#messages').after(json.text + '<br>');
//       // }

//     });
//   }

//   addOrUpdateWsRequestsList(request) {

//     console.log("% WsRequestsService getWsRequests addOrUpdateWsRequestsList: ", request);

//   }

//   wsConnect() {
//     console.log('%% HI WsRequestsService! - wsService ')
//     this.messages = <Subject<Message>>this.wsService.connect(CHAT_URL).map(
//       (response: MessageEvent): Message => {
//         console.log('%% WsRequestsService response ', response)
//         let data = JSON.parse(response.data);
//         return data;
//         // return {
//         //   action: data.action,
//         //   payload: data.payload.topic
//         // };

//       }
//     );
//   }


//   // topic: '/5dc924a13fa2b8001798b9c1/requests',



//   getCurrentProject() {

//     // IF EXIST A PROJECT UNSUSCRIBE query.onSnapshot AND RESET REQUEST LIST
//     this.auth.project_bs.subscribe((project) => {
//       console.log('!!! REQUEST SERVICE: SUBSCRIBE TO THE PROJECT PUBLISHED BY AUTH SERVICE ', project)
//       // // tslint:disable-next-line:no-debugger
//       // debugger
//       if (project) {

//         setTimeout(() => {
//           this.subscribeToWebsocket(project._id)
//         }, 2000);


//         //   if (this.unsubscribe) {
//         //     this.unsubscribe();
//         //     console.log('!!! REQUEST SERVICE: unsubscribe ', this.unsubscribe)
//         //     this.resetRequestsList();
//         //   }
//         //   this.project = project;

//         //   this.startRequestsQuery();
//         //   this.subscribeToWebsocket(project)

//         // } else {
//         //   if (this.unsubscribe) {
//         //     this.unsubscribe();
//         //     this.resetRequestsList();
//         //   }
//         //   this.project = project;
//       }

//       // console.log('00 -> REQUEST SERVICE project from AUTH service subscription ', project)
//     });
//   }

//   subscribeToWebsocket(project_id) {

//     var message = {
//       action: 'subscribe',
//       payload: {
//         topic: '/' + project_id + '/requests',
//         message: undefined,
//         method: undefined
//       },
//     };

//     this.messages.next(message);
//     console.log("%% subscribeToWebsocket new message from client to websocket  this.messages: ", this.messages);
//     console.log("%% subscribeToWebsocket new message from client to websocket: ", message);

//   }

//   isArray(what) {
//     return Object.prototype.toString.call(what) === '[object Array]';
//   }

// }



