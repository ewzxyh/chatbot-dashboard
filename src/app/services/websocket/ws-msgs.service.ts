import { Injectable } from '@angular/core';
import { WebSocketJs } from "./websocketjs";
import { AuthService } from '../../core/auth.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

const CHAT_URL = "ws://tiledesk-server-pre.herokuapp.com?token=JWT [REDACTED_JWT]";
@Injectable()

export class WsMsgsService {

  wsService: WebSocketJs;
  project_id: string;
  wsMsgsList: any;

  public wsMsgsList$: BehaviorSubject<[]> = new BehaviorSubject<[]>([]);
  constructor(

    public auth: AuthService

  ) {

    this.getCurrentProject();
    this.getWsRequests();
  }

  getCurrentProject() {


    this.auth.project_bs.subscribe((project) => {
      console.log('!!! WsMsgsService project ', project)
      // // tslint:disable-next-line:no-debugger
      // debugger
      if (project) {

        this.project_id = project._id
      }

    });
  }


  getWsRequests() {
    const self = this;
    self.wsMsgsList = []

    this.wsService = new WebSocketJs(
      CHAT_URL,

      function (data, notification) {

        console.log("% WsMsgsService create", data);
        console.log("% WsMsgsService notification", notification);



        const hasFound = self.wsMsgsList.filter((obj: any) => {
          return obj._id === data._id;
        });

        if (hasFound.length === 0) {
          self.addWsMsg(data)
        }

      }, function (data, notification) {

        console.log("% WsMsgsService update", data);
        console.log("% WsMsgsService notification", notification);

        self.updateWsMsg(data)
      }
    );

    // if(this.wsRequestsList) {
    //   self.wsRequestsList$.next(this.wsRequestsList);
    // }

  }



  addWsMsg(msg) {
    console.log("% WsMsgsService addWsMsgs wsMsgsList.length", this.wsMsgsList.length);

    this.wsMsgsList.push(msg);

    if (this.wsMsgsList) {
      this.wsMsgsList$.next(this.wsMsgsList);
    }
  }

  updateWsMsg(msg) {

    for (let i = 0; i < this.wsMsgsList.length; i++) {

      if (msg._id === this.wsMsgsList[i]._id) {
        console.log("% WsRequestsService getWsRequests UPATE AN EXISTING REQUESTS - request._id : ", msg._id, ' wsMsgsList[i]._id: ', this.wsMsgsList[i]._id);
        /// UPATE AN EXISTING REQUESTS
        this.wsMsgsList[i] = msg

        if (this.wsMsgsList) {
          this.wsMsgsList$.next(msg);
        }
      }
    }
  }


  // getWsRequestMsgs(request_id) {

  //   this.wsService = new WebSocketJs(
  // }

  subscribeToWebsocket(request_id) {

    var message = {
      action: 'subscribe',
      payload: {

        topic: '/' + '5dc924a13fa2b8001798b9c1' + '/requests/' + request_id + '/messages/',
        message: undefined,
        method: undefined
      },
    };
    var str = JSON.stringify(message);
    console.log("%% str " + str);

    this.wsService.start(str);

    // this.messages.next(message);

    console.log("%% subscribeToWebsocket new message from client to websocket: ", message);

  }



}
