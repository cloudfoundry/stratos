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

  getUserByUsername(username: string): promise.Promise<any> {
    return this.requestHelper.sendGet(`Users?filter=userName+eq+%22${username}%22&startIndex=1`).then(res => {
      return res.totalResults === 1 ?
        res.resources[0] :
        promise.rejected(`Found no or multiple users matching name '${username}'`);
    });
  }

  getUsers(): promise.Promise<any> {
    return this.requestHelper.sendGet(`Users?attributes=userName%2Cid`);
  }

  createUser(userName: string, zone?: string): promise.Promise<{ id: string, userName: string }> {
    const body = {
      externalId: 'e2e',
      userName,
      password: userName,
      emails: [{ value: userName + '@e2e.com' }],
      origin: 'uaa',
      zoneId: e2e.secrets.getDefaultCfsUaaZone(zone)
    };
    return this.requestHelper.sendPost('Users', JSON.stringify(body)).then(res => {
      const newUser = JSON.parse(res);
      return {
        id: newUser.id,
        userName: newUser.userName
      };
    });
  }

  deleteUser(uaaUserGuid?: string, userName?: string) {
    if (!uaaUserGuid && !userName) {
      return promise.rejected('Either uaa guid or username should be supplied');
    }
    const guidP = uaaUserGuid ? promise.fullyResolved(uaaUserGuid) : this.getUserByUsername(userName).then(user => user.id);

    return guidP.then(guid => this.requestHelper.sendDelete(`Users/${guid}`));
  }

  getIdentityZone(zone?: string) {
    return this.requestHelper.sendGet(`identity-zones/${e2e.secrets.getDefaultCfsUaaZone(zone)}`);
  }

  getClients() {
    return this.requestHelper.sendGet('oauth/clients');
  }
}
