import Q = require('q');
import { promise } from 'selenium-webdriver';

import { CFResponse } from '../../frontend/app/store/types/api.types';
import { EndpointModel } from '../../frontend/app/store/types/endpoint.types';
import { E2ESetup } from '../e2e';
import { ConsoleUserType, E2EHelpers } from './e2e-helpers';
import { RequestHelpers } from './request-helpers';

export class CFRequestHelpers extends RequestHelpers {

  private e2eHelper = new E2EHelpers();
  private adminRequest;

  constructor(public e2eSetup: E2ESetup) {
    super();
  }

  createCfHeader = (cfGuid: string) => ({
    'x-cap-cnsi-list': cfGuid,
    'x-cap-passthrough': 'true'
  })

  getCfCnsi = (cfName?: string): promise.Promise<EndpointModel> => {
    cfName = cfName || this.e2eHelper.secrets.getDefaultCFEndpoint().name;
    return this.sendRequestAdminSession('pp/v1/cnsis', 'GET', {})
      .then(response => {
        const cnsis: EndpointModel[] = JSON.parse(response);
        const promises = [];
        return cnsis.find(cnsi => cnsi.name === cfName);
      });
  }

  sendCfGet = (cfGuid: string, url: string): promise.Promise<CFResponse> => {
    return this.sendCfRequest(cfGuid, url, 'GET').then(response => {
      return JSON.parse(response);
    });
  }

  sendCfDelete = (cfGuid: string, url: string): promise.Promise<any> => {
    return this.sendCfRequest(cfGuid, url, 'DELETE');
  }

  private sendCfRequest = (cfGuid: string, url: string, method: string): promise.Promise<any> => {
    const req = this.newRequest();
    return this.sendRequestAdminSession('pp/v1/proxy/v2/' + url, method, this.createCfHeader(cfGuid));
  }

  private sendRequestAdminSession(url: string, method: string, headers) {
    let sessionPromise;
    if (!this.adminRequest) {
      this.adminRequest = this.newRequest();
      sessionPromise = this.createSession(this.adminRequest, ConsoleUserType.admin);
    } else {
      sessionPromise = Q.resolve(this.adminRequest);
    }
    return sessionPromise.then(() => {
      return this.sendRequest(this.adminRequest, {
        headers,
        method,
        url
      });
    });
  }
}
