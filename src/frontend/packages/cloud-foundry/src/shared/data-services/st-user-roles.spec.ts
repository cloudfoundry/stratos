import { StUser } from '../../services/endpoint-data/stratos-types';
import { orgRolesFromStUser, spaceRolesFromStUser, stIsOrgManager } from './st-user-roles';

const user: StUser = {
  guid: 'u1', username: 'alice', cnsiGuid: 'cf1',
  orgRoles: [{ orgGuid: 'o1', roles: ['manager', 'user'] }],
  spaceRoles: [{ orgGuid: 'o1', spaceGuid: 's1', roles: ['developer'] }],
};

describe('st-user-roles', () => {
  it('maps org buckets to IUserPermissionInOrg with plural-keyed permissions', () => {
    const orgs = orgRolesFromStUser(user, new Map([['o1', 'Org One']]));
    expect(orgs).toHaveLength(1);
    expect(orgs[0]).toMatchObject({ orgGuid: 'o1', name: 'Org One' });
    expect(orgs[0].permissions.managers).toBe(true);
    expect(orgs[0].permissions.users).toBe(true);
    expect(orgs[0].permissions.auditors).toBe(false);
    expect(orgs[0].permissions.billing_managers).toBe(false);
  });

  it('maps space buckets to IUserPermissionInSpace', () => {
    const spaces = spaceRolesFromStUser(user, new Map([['o1', 'Org One']]), new Map([['s1', 'Space One']]));
    expect(spaces[0]).toMatchObject({ spaceGuid: 's1', orgGuid: 'o1', orgName: 'Org One', name: 'Space One' });
    expect(spaces[0].permissions.developers).toBe(true);
    expect(spaces[0].permissions.managers).toBe(false);
  });

  it('predicates read the singular bucket names', () => {
    expect(stIsOrgManager(user, 'o1')).toBe(true);
    expect(stIsOrgManager(user, 'oX')).toBe(false);
  });
});
