import { RequestHelpers } from './request-helpers';
import { promise } from 'selenium-webdriver';
import { E2ESetup } from '../e2e';
import { E2EHelpers } from './e2e-helpers';
import { EndpointMetadata } from '../endpoints/endpoints.po';

export class CFRequestHelpers extends RequestHelpers {

  private e2eHelper: E2EHelpers;

  constructor(public e2eSetup: E2ESetup) {
    super();
  }

  createCfHeader = (cfGuid: string) => ({
    'x-cap-cnsi-list': cfGuid,
    'x-cap-passthrough': 'true'
  })

  getCfCnsi = (cfName = this.e2eHelper.secrets.getDefaultCFEndpoint().name): promise.Promise<EndpointMetadata> => {
    return this.sendRequest(this.e2eSetup.adminReq, { method: 'GET', url: 'pp/v1/cnsis' })
      .then(response => {
        const cnsis: EndpointMetadata[] = JSON.parse(response);
        const promises = [];
        return cnsis.find(cnsi => cnsi.name === cfName);
      });
  }

  sendGet = (cfGuid: string, url: string, request = this.e2eSetup.adminReq): promise.Promise<any> => {
    return this.sendCfRequest(request, cfGuid, url, 'GET');
  }

  sendDelete = (cfGuid: string, url: string, request = this.e2eSetup.adminReq): promise.Promise<any> => {
    return this.sendCfRequest(request, cfGuid, url, 'DELETE');
  }

  private sendCfRequest = (request: any, cfGuid: string, url: string, method: string): promise.Promise<any> => {
    return this.sendRequest(request, {
      headers: this.createCfHeader(cfGuid),
      method,
      url: 'pp/v1/proxy/v2/' + url
    });
  }
}
