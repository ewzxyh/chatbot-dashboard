// tslint:disable:max-line-length
import { Injectable } from '@angular/core';

// export const MONGODB_CONTACTS_BASE_URL = 'http://localhost:3000/app1/contacts/';
// const TOKEN = 'JWT [REDACTED_JWT]';

@Injectable()
export class MongodbConfService {

  // SWITCH LOCALHOST \ CHAT21.ORG
  LOCALHOST = true;

  // URL
  MONGODB_CONTACTS_BASE_URL: any;
  MONGODB_DEPARTMENTS_BASE_URL: any;

  TOKEN: any;

  constructor() {

    if (this.LOCALHOST) {
      this.MONGODB_CONTACTS_BASE_URL = 'http://localhost:3000/app1/contacts/';
      this.MONGODB_DEPARTMENTS_BASE_URL  = 'http://localhost:3000/app1/departments/';
      this.TOKEN = 'JWT [REDACTED_JWT]';
    } else {
      this.MONGODB_CONTACTS_BASE_URL = 'http://api.chat21.org/app1/contacts/';
      this.TOKEN = 'JWT [REDACTED_JWT]';
    }

  }



}
