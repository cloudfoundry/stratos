import { promise } from 'protractor';

import { CFResponse } from '../../frontend/app/store/types/api.types';
import { EndpointModel } from '../../frontend/app/store/types/endpoint.types';
import { E2ESetup } from '../e2e';
import { E2EHelpers } from './e2e-helpers';
import { RequestHelpers } from './request-helpers';

export class CFRequestHelpers extends RequestHelpers {

  private e2eHelper = new E2EHelpers();

  constructor(public e2eSetup: E2ESetup) {
    super();
  }

  createCfHeader = (cfGuid: string) => ({
    'x-cap-cnsi-list': cfGuid,
    'x-cap-passthrough': true
  })

  getCfCnsi = (cfName?: string): promise.Promise<EndpointModel> => {
    cfName = cfName || this.e2eHelper.secrets.getDefaultCFEndpoint().name;
    return this.sendRequestAdminSession('pp/v1/cnsis', 'GET', {})
      .then((response: string) => {
        const cnsis = JSON.parse(response) as EndpointModel[];
        return cnsis.find(cnsi => cnsi.name === cfName);
      });
  }

  sendCfGet = (cfGuid: string, url: string): promise.Promise<CFResponse> => this.sendCfRequest(cfGuid, url, 'GET').then(JSON.parse);

  sendCfPost = (cfGuid: string, url: string, body: any): promise.Promise<CFResponse> =>
    this.sendCfRequest(cfGuid, url, 'POST', body).then(JSON.parse)

  sendCfPut = (cfGuid: string, url: string, body?: any): promise.Promise<CFResponse> =>
    this.sendCfRequest(cfGuid, url, 'PUT', body).then(JSON.parse)

  sendCfDelete = (cfGuid: string, url: string): promise.Promise<any> => this.sendCfRequest(cfGuid, url, 'DELETE');

  private sendCfRequest = (cfGuid: string, url: string, method: string, body?: string): promise.Promise<any> =>
    this.sendRequestAdminSession('pp/v1/proxy/v2/' + url, method, this.createCfHeader(cfGuid), body)

  private sendRequestAdminSession = (url: string, method: string, headers: object, body?: any) => {
    return this.sendRequest(this.e2eSetup.adminReq, {
      headers,
      method,
      url
    }, body);
  }

}
