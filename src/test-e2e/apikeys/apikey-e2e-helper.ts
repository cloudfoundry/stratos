import { promise } from 'protractor';

import { E2ESetup } from '../e2e';
import { RequestHelpers } from '../helpers/request-helpers';

const reqHelpers = new RequestHelpers();

export class ApiKeyE2eHelper {


  constructor(public e2eSetup: E2ESetup) {
  }

  addKey(comment: string, isAdmim: boolean): promise.Promise<any> {
    return reqHelpers.sendRequest(isAdmim ? this.e2eSetup.adminReq : this.e2eSetup.userReq, { method: 'POST', url: 'pp/v1/api-key' }, null, {
      comment
    });
  }

  deleteKey(guid: string, isAdmim: boolean): promise.Promise<any> {
    return reqHelpers.sendRequest(isAdmim ? this.e2eSetup.adminReq : this.e2eSetup.userReq, { method: 'DELETE', url: 'pp/v1/api-key' }, null, {
      guid
    });
  }

  getAllKeys(isAdmim: boolean): promise.Promise<any> {
    return reqHelpers.sendRequest(isAdmim ? this.e2eSetup.adminReq : this.e2eSetup.userReq, { method: 'GET', url: 'pp/v1/api-key' }, null, undefined);
  }
}