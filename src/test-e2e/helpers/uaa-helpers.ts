import { promise } from 'protractor';

import { e2e } from '../e2e';
import { UaaRequestHelpers } from './uaa-request-helpers';

export class UaaHelpers {

  private requestHelper: UaaRequestHelpers;

  constructor() {
    this.requestHelper = new UaaRequestHelpers();
  }

  setup(): promise.Promise<any> {
    return this.requestHelper.setup();
  }

  getUser(uaaUserGuid: string): promise.Promise<any> {
    return this.requestHelper.sendGet(`Users/${uaaUserGuid}`);
  }

  getUsers(): promise.Promise<any> {
    return this.requestHelper.sendGet(`Users?attributes=userName%2Cid`);
  }

  createUser(userName: string, zone?: string): promise.Promise<{id: string}> {
    const body = {
      externalId: 'e2e',
      userName,
      password: userName,
      emails: [{value: userName + '@e2e.com'}],
      origin: 'uaa',
      zoneId: e2e.secrets.getDefaultCfsUaaZone(zone)
    };
    return this.requestHelper.sendPost('Users', JSON.stringify(body)).then(res => {
      const newUser = JSON.parse(res);
      return {
        id: newUser.id
      };
    });
  }

  deleteUser(uaaUserGuid: string) {
    return this.requestHelper.sendDelete(`Users/${uaaUserGuid}`);
  }

  getIdentityZone(zone?: string) {
    return this.requestHelper.sendGet(`identity-zones/${e2e.secrets.getDefaultCfsUaaZone(zone)}`);
  }

  getClients() {
    return this.requestHelper.sendGet('oauth/clients');
  }
}
