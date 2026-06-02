import { describe, expect, it } from 'vitest';

import { APIResource } from '@stratosui/store';

import { CfUserRelationTypes } from '../actions/permissions.actions';
import {
  IAllCfRolesState,
  ICfRolesState,
  IOrgRoleState,
  ISpaceRoleState,
  RoleEntities,
} from '../store/types/cf-current-user-roles.types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../store/types/cf-user.types';
import {
  applyCfRoleChange,
  applyCfUserRelations,
  CfRolesRequestStage,
  createCfOrgRoleStateState,
  getDefaultCfEndpointRoles,
  propagateCfConnectedAdmin,
  registerCfEndpoint,
  removeCfEndpoint,
  removeCfOrg,
  removeCfSpace,
  setCfRequestState,
} from './cf-roles-state.helpers';

const testOrgGuid = 'org-1';
const testSpaceGuid = 'space-1';
const generalGuid = 'guid-123';
const cf = 'cf-1';

function spaceData(orgGuid = testOrgGuid, spaceGuid = testSpaceGuid): APIResource<{ organization_guid: string }>[] {
  return [{ metadata: { guid: spaceGuid, created_at: '1', updated_at: '1', url: '1' }, entity: { organization_guid: orgGuid } }];
}
function orgData(orgGuid = testOrgGuid): APIResource<any>[] {
  return [{ metadata: { guid: orgGuid, created_at: '1', updated_at: '1', url: '1' }, entity: {} }];
}

/** Mirrors the legacy reducer spec's `getState` oracle helper. */
function getState(
  orgOrSpace: RoleEntities,
  allRoles: { guid: string, roles: ISpaceRoleState | IOrgRoleState }[] = [],
  roles?: ISpaceRoleState | IOrgRoleState,
): ICfRolesState {
  const baseState = getDefaultCfEndpointRoles();
  if (!allRoles.length) {
    let guid = testSpaceGuid;
    if (orgOrSpace === RoleEntities.ORGS) {
      guid = testOrgGuid;
    }
    allRoles.push({ guid, roles });
  }
  const orgSpaceRoles: any = { [orgOrSpace]: {} };
  if (orgOrSpace === RoleEntities.SPACES) {
    orgSpaceRoles.organizations = { [testOrgGuid]: createCfOrgRoleStateState() };
  }
  allRoles.forEach(role => {
    orgSpaceRoles[orgOrSpace][role.guid] = role.roles;
    if (orgOrSpace === RoleEntities.SPACES) {
      orgSpaceRoles.organizations[testOrgGuid].spaceGuids.push(role.guid);
    }
  });
  return { ...baseState, ...orgSpaceRoles };
}

describe('cf-roles-state.helpers', () => {
  describe('applyCfUserRelations (parity with currentCfUserRolesReducer)', () => {
    it('adds org manager role to org', () => {
      const state = applyCfUserRelations({}, CfUserRelationTypes.MANAGED_ORGANIZATION, cf, orgData());
      expect(state[cf]).toEqual(getState(RoleEntities.ORGS, [], {
        isManager: true, isAuditor: false, isBillingManager: false, isUser: false, spaceGuids: [],
      }));
    });
    it('adds org auditor role to org', () => {
      const state = applyCfUserRelations({}, CfUserRelationTypes.AUDITED_ORGANIZATIONS, cf, orgData());
      expect(state[cf]).toEqual(getState(RoleEntities.ORGS, [], {
        isManager: false, isAuditor: true, isBillingManager: false, isUser: false, spaceGuids: [],
      }));
    });
    it('adds org billing manager role to org', () => {
      const state = applyCfUserRelations({}, CfUserRelationTypes.BILLING_MANAGED_ORGANIZATION, cf, orgData());
      expect(state[cf]).toEqual(getState(RoleEntities.ORGS, [], {
        isManager: false, isAuditor: false, isBillingManager: true, isUser: false, spaceGuids: [],
      }));
    });
    it('adds org user role to org', () => {
      const state = applyCfUserRelations({}, CfUserRelationTypes.ORGANIZATIONS, cf, orgData());
      expect(state[cf]).toEqual(getState(RoleEntities.ORGS, [], {
        isManager: false, isAuditor: false, isBillingManager: false, isUser: true, spaceGuids: [],
      }));
    });

    it('retains other org roles', () => {
      let state = applyCfUserRelations({}, CfUserRelationTypes.ORGANIZATIONS, cf, orgData());
      state = applyCfUserRelations(state, CfUserRelationTypes.AUDITED_ORGANIZATIONS, cf, orgData(generalGuid));
      expect(state[cf]).toEqual(getState(RoleEntities.ORGS, [
        { guid: testOrgGuid, roles: { isManager: false, isAuditor: false, isBillingManager: false, isUser: true, spaceGuids: [] } },
        { guid: generalGuid, roles: { isManager: false, isAuditor: true, isBillingManager: false, isUser: false, spaceGuids: [] } },
      ]));
    });

    it('retains other space roles (and back-fills org spaceGuids)', () => {
      let state = applyCfUserRelations({}, CfUserRelationTypes.SPACES, cf, spaceData());
      state = applyCfUserRelations(state, CfUserRelationTypes.MANAGED_SPACES, cf, spaceData(generalGuid, generalGuid));
      const expected = getState(RoleEntities.SPACES, [
        { guid: testSpaceGuid, roles: { orgId: testOrgGuid, isManager: false, isAuditor: false, isDeveloper: true } },
        { guid: generalGuid, roles: { orgId: generalGuid, isManager: true, isAuditor: false, isDeveloper: false } },
      ]);
      const orgExpected = getState(RoleEntities.ORGS, [
        { guid: testOrgGuid, roles: { isManager: false, isAuditor: false, isBillingManager: false, isUser: false, spaceGuids: [testSpaceGuid] } },
        { guid: generalGuid, roles: { isManager: false, isAuditor: false, isBillingManager: false, isUser: false, spaceGuids: [generalGuid] } },
      ]);
      expected.organizations = orgExpected.organizations;
      expect(state[cf]).toEqual(expected);
    });
  });

  describe('endpoint lifecycle', () => {
    it('registerCfEndpoint seeds a default row and is idempotent', () => {
      let state = registerCfEndpoint({}, cf);
      expect(state[cf]).toEqual(getDefaultCfEndpointRoles());
      const same = registerCfEndpoint(state, cf);
      expect(same).toBe(state);
    });
    it('removeCfEndpoint drops the row', () => {
      const seeded: IAllCfRolesState = { [cf]: getDefaultCfEndpointRoles() };
      expect(removeCfEndpoint(seeded, cf)[cf]).toBeUndefined();
      // no-op when absent
      expect(removeCfEndpoint({}, cf)).toEqual({});
    });
    it('propagateCfConnectedAdmin derives global flags from scopes', () => {
      const state = propagateCfConnectedAdmin({}, cf, { admin: true, scopes: ['cloud_controller.admin', 'cloud_controller.read'] } as any);
      expect(state[cf].global.isAdmin).toBe(true);
      expect(state[cf].global.canRead).toBe(true);
      expect(state[cf].global.scopes).toEqual(['cloud_controller.admin', 'cloud_controller.read']);
    });
  });

  describe('request state', () => {
    it('transitions a seeded endpoint row', () => {
      let state = registerCfEndpoint({}, cf);
      state = setCfRequestState(state, cf, CfRolesRequestStage.START);
      expect(state[cf].state).toEqual({ initialised: false, fetching: true, error: false });
      state = setCfRequestState(state, cf, CfRolesRequestStage.SUCCESS);
      expect(state[cf].state).toEqual({ initialised: true, fetching: false, error: false });
      state = setCfRequestState(state, cf, CfRolesRequestStage.FAILURE);
      expect(state[cf].state).toEqual({ initialised: true, fetching: false, error: true });
    });
  });

  describe('org/space removal', () => {
    it('removeCfSpace drops the space and prunes the org spaceGuids', () => {
      let state = applyCfUserRelations({}, CfUserRelationTypes.SPACES, cf, spaceData());
      state = removeCfSpace(state, cf, testSpaceGuid);
      expect(state[cf].spaces[testSpaceGuid]).toBeUndefined();
      expect(state[cf].organizations[testOrgGuid].spaceGuids).toEqual([]);
    });
    it('removeCfOrg drops the org', () => {
      let state = applyCfUserRelations({}, CfUserRelationTypes.ORGANIZATIONS, cf, orgData());
      state = removeCfOrg(state, cf, testOrgGuid);
      expect(state[cf].organizations[testOrgGuid]).toBeUndefined();
    });
  });

  describe('applyCfRoleChange (restored: connected-user role mutation)', () => {
    it('adds an org role for the connected user', () => {
      let state = registerCfEndpoint({}, cf);
      state = applyCfRoleChange(state, {
        endpointGuid: cf, isSpace: false, entityGuid: testOrgGuid, orgGuid: testOrgGuid,
        permissionTypeKey: OrgUserRoleNames.MANAGER, updateConnectedUser: true,
      }, true);
      expect(state[cf].organizations[testOrgGuid].isManager).toBe(true);
    });
    it('ignores changes that do not target the connected user', () => {
      const seeded = registerCfEndpoint({}, cf);
      const state = applyCfRoleChange(seeded, {
        endpointGuid: cf, isSpace: false, entityGuid: testOrgGuid, orgGuid: testOrgGuid,
        permissionTypeKey: OrgUserRoleNames.MANAGER, updateConnectedUser: false,
      }, true);
      expect(state).toBe(seeded);
    });
    it('adds a space role and back-fills the org spaceGuids', () => {
      let state = applyCfUserRelations({}, CfUserRelationTypes.ORGANIZATIONS, cf, orgData());
      state = applyCfRoleChange(state, {
        endpointGuid: cf, isSpace: true, entityGuid: testSpaceGuid, orgGuid: testOrgGuid,
        permissionTypeKey: SpaceUserRoleNames.DEVELOPER, updateConnectedUser: true,
      }, true);
      expect(state[cf].spaces[testSpaceGuid].isDeveloper).toBe(true);
      expect(state[cf].organizations[testOrgGuid].spaceGuids).toContain(testSpaceGuid);
    });
  });
});
