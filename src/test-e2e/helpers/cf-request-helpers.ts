import { promise } from 'selenium-webdriver';

import { EndpointModel } from '../../frontend/app/store/types/endpoint.types';
import { E2ESetup } from '../e2e';
import { EndpointMetadata } from '../endpoints/endpoints.po';
import { E2EHelpers, ConsoleUserType } from './e2e-helpers';
import { RequestHelpers } from './request-helpers';
import { CFResponse } from '../../frontend/app/store/types/api.types';

export class CFRequestHelpers extends RequestHelpers {

  private e2eHelper = new E2EHelpers();



  constructor(public e2eSetup: E2ESetup) {
    super();
  }

  createCfHeader = (cfGuid: string) => ({
    'x-cap-cnsi-list': cfGuid,
    'x-cap-passthrough': 'true'
  })

  getCfCnsi = (cfName?: string): promise.Promise<EndpointModel> => {
    cfName = cfName || this.e2eHelper.secrets.getDefaultCFEndpoint().name;
    const req = this.newRequest();
    return this.sendRequest(req, { method: 'GET', url: 'pp/v1/cnsis' })
      .then(response => {
        const cnsis: EndpointModel[] = JSON.parse(response);
        const promises = [];
        return cnsis.find(cnsi => cnsi.name === cfName);
      });
  }

  sendGet = (cfGuid: string, url: string, request = this.e2eSetup.adminReq): promise.Promise<CFResponse> => {
    return this.sendCfRequest(request, cfGuid, url, 'GET').then(response => {
      return JSON.parse(response);
    });
  }

  sendDelete = (cfGuid: string, url: string, request = this.e2eSetup.adminReq): promise.Promise<any> => {
    return this.sendCfRequest(request, cfGuid, url, 'DELETE');
  }

  private sendCfRequest = (request: any, cfGuid: string, url: string, method: string): promise.Promise<any> => {
    const req = this.newRequest();
    return this.createSession(req, ConsoleUserType.admin).then(() => {
      return this.sendRequest(request, {
        headers: this.createCfHeader(cfGuid),
        method,
        url: 'pp/v1/proxy/v2/' + url
      });
    });
  }
}
