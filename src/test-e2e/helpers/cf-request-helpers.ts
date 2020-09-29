import { promise } from 'protractor';

import { EndpointModel } from '../../frontend/packages/store/src/types/endpoint.types';
import { e2e, E2ESetup } from '../e2e';
import { E2EHelpers } from './e2e-helpers';
import { RequestHelpers } from './request-helpers';
import { CFResponse } from '../../frontend/packages/cloud-foundry/src/store/types/cf-api.types';

export class CFRequestHelpers extends RequestHelpers {

  private e2eHelper = new E2EHelpers();

  constructor(public e2eSetup: E2ESetup) {
    super();
  }

  createCfHeader = (cfGuid: string) => ({
    'x-cap-cnsi-list': cfGuid,
    'x-cap-passthrough': true
  })

  getCfInfo = (cfName?: string): promise.Promise<EndpointModel> => {
    cfName = cfName || this.e2eHelper.secrets.getDefaultCFEndpoint().name;
    return this.sendRequestAdminSession('api/v1/endpoints', 'GET', {})
      .then((response: string) => {
        const cnsis = JSON.parse(response) as EndpointModel[];
        return cnsis.find(cnsi => cnsi.name === cfName);
      });
  }

  getDefaultCFEndpoint = () => {
    return this.e2eHelper.secrets.getDefaultCFEndpoint();
  }

  getCfGuid = (cfName?: string): promise.Promise<string> =>
    this.getCfInfo(cfName).then((endpoint: EndpointModel) => endpoint ? endpoint.guid : null)

  sendCfGet<T = CFResponse>(cfGuid: string, url: string): promise.Promise<T> {
    return this.sendCfRequest(cfGuid, url, 'GET').then(JSON.parse);
  }

  sendCfPost<T = CFResponse>(cfGuid: string, url: string, body: any): promise.Promise<T> {
    return this.sendCfRequest(cfGuid, url, 'POST', body).then(JSON.parse);
  }

  sendCfPut<T = CFResponse>(cfGuid: string, url: string, body?: any): promise.Promise<T> {
    return this.sendCfRequest(cfGuid, url, 'PUT', body).then(JSON.parse);
  }

  sendCfDelete = (cfGuid: string, url: string): promise.Promise<any> => this.sendCfRequest(cfGuid, url, 'DELETE');

  private sendCfRequest = (cfGuid: string, url: string, method: string, body?: string): promise.Promise<any> =>
    this.sendRequestAdminSession('pp/v1/proxy/v2/' + url, method, this.createCfHeader(cfGuid), body)
      .catch(error => {
        // Track the url against the error. Sometimes we don't get this from the stack trace
        e2e.log(`Failed to handle request to url: '${url}'. Reason: '${error}'`);
        throw error;
      })

  private sendRequestAdminSession = (url: string, method: string, headers: object, body?: any) =>
    this.sendRequest(this.e2eSetup.adminReq, {
      headers,
      method,
      url
    }, body)

}
