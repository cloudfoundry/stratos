import { CfUserRelationTypes, GetCurrentCfUserRelationsComplete } from '../../../actions/permissions.actions';
import {
  IAllCfRolesState,
  ICfRolesState,
  IOrgRoleState,
  ISpaceRoleState,
  RoleEntities,
} from '../../types/cf-current-user-roles.types';
import { getDefaultCfEndpointRoles } from './current-cf-user-base-cf-role.reducer';
import { createCfOrgRoleStateState } from './current-cf-user-roles-org.reducer';
import { currentCfUserRolesReducer } from './current-cf-user-roles.reducer';

const testOrgGuid = 'org-1';
const testSpaceGuid = 'space-1';
const generalGuid = 'guid-123';
const testCFEndpointGuid = 'cf-1';

function getSpaceAction(type: CfUserRelationTypes, orgGuid: string = testOrgGuid, spaceGuid: string = testSpaceGuid) {
  return new GetCurrentCfUserRelationsComplete(
    type,
    testCFEndpointGuid,
    [{ metadata: { guid: spaceGuid, created_at: '1', updated_at: '1', url: '1' }, entity: { organization_guid: orgGuid } }]
  );
}

function getOrgAction(type: CfUserRelationTypes, orgGuid: string = testOrgGuid) {
  return new GetCurrentCfUserRelationsComplete(
    type,
    testCFEndpointGuid,
    [{ metadata: { guid: orgGuid, created_at: '1', updated_at: '1', url: '1' }, entity: {} }]
  );
}

function getState(
  orgOrSpace: RoleEntities,
  allRoles: { guid: string, roles: ISpaceRoleState | IOrgRoleState }[] = [],
  roles?: ISpaceRoleState | IOrgRoleState
): ICfRolesState {
  const baseState = getDefaultCfEndpointRoles();
  if (!allRoles.length) {
    let guid = testSpaceGuid;
    if (orgOrSpace === RoleEntities.ORGS) {
      guid = testOrgGuid;
    }
    allRoles.push({ guid, roles });
  }
  const orgSpaceRoles = {
    [orgOrSpace]: {}
  };
  if (orgOrSpace === RoleEntities.SPACES) {
    orgSpaceRoles.organizations = {
      [testOrgGuid]: createCfOrgRoleStateState()
    };
  }
  allRoles.forEach(role => {
    orgSpaceRoles[orgOrSpace][role.guid] = role.roles;
    if (orgOrSpace === RoleEntities.SPACES) {
      orgSpaceRoles.organizations[testOrgGuid].spaceGuids.push(role.guid);
    }
  });
  return {
    ...baseState,
    ...orgSpaceRoles
  };
}

describe('currentCfUserRolesReducer', () => {
  it('set defaults', () => {
    const state = currentCfUserRolesReducer(undefined, { type: 'FAKE_ACTION' });
    const expectedState: IAllCfRolesState = null;
    expect(state).toEqual(expectedState);
  });
  it('should add org manager role to org', () => {
    const state = currentCfUserRolesReducer(undefined, getOrgAction(CfUserRelationTypes.MANAGED_ORGANIZATION));
    const cfPermissions = state[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState(RoleEntities.ORGS, [], {
      isManager: true,
      isAuditor: false,
      isBillingManager: false,
      isUser: false,
      spaceGuids: []
    }));
  });
  it('should add org auditor role to org', () => {
    const state = currentCfUserRolesReducer(undefined, getOrgAction(CfUserRelationTypes.AUDITED_ORGANIZATIONS));
    const cfPermissions = state[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState(RoleEntities.ORGS, [], {
      isManager: false,
      isAuditor: true,
      isBillingManager: false,
      isUser: false,
      spaceGuids: []
    }));
  });
  it('should add org billing manager role to org', () => {
    const state = currentCfUserRolesReducer(undefined, getOrgAction(CfUserRelationTypes.BILLING_MANAGED_ORGANIZATION));
    const cfPermissions = state[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState(RoleEntities.ORGS, [], {
      isManager: false,
      isAuditor: false,
      isBillingManager: true,
      isUser: false,
      spaceGuids: []
    }));
  });
  it('should add org user role to org', () => {
    const state = currentCfUserRolesReducer(undefined, getOrgAction(CfUserRelationTypes.ORGANIZATIONS));
    const cfPermissions = state[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState(RoleEntities.ORGS, [], {
      isManager: false,
      isAuditor: false,
      isBillingManager: false,
      isUser: true,
      spaceGuids: []
    }));
  });

  it('should retain other org roles', () => {
    let state = currentCfUserRolesReducer(undefined, getOrgAction(CfUserRelationTypes.ORGANIZATIONS));
    state = currentCfUserRolesReducer(state, getOrgAction(CfUserRelationTypes.AUDITED_ORGANIZATIONS, generalGuid));
    const cfPermissions = state[testCFEndpointGuid];
    const toEqual = getState(RoleEntities.ORGS, [{
      guid: testOrgGuid,
      roles: {
        isManager: false,
        isAuditor: false,
        isBillingManager: false,
        isUser: true,
        spaceGuids: []
      },
    },
    {
      guid: generalGuid,
      roles: {
        isManager: false,
        isAuditor: true,
        isBillingManager: false,
        isUser: false,
        spaceGuids: []
      }
    }]);
    expect(cfPermissions).toEqual(toEqual);
  });

  it('should retain other space roles', () => {
    let state = currentCfUserRolesReducer(undefined, getSpaceAction(CfUserRelationTypes.SPACES));
    state = currentCfUserRolesReducer(state, getSpaceAction(CfUserRelationTypes.MANAGED_SPACES, generalGuid, generalGuid));
    const cfPermissions = state[testCFEndpointGuid];
    const toEqual = getState(RoleEntities.SPACES, [{
      guid: testSpaceGuid,
      roles: {
        orgId: testOrgGuid,
        isManager: false,
        isAuditor: false,
        isDeveloper: true
      }
    },
    {
      guid: generalGuid,
      roles: {
        orgId: generalGuid,
        isManager: true,
        isAuditor: false,
        isDeveloper: false
      }
    }]);
    const orgState = getState(RoleEntities.ORGS, [{
      guid: testOrgGuid,
      roles: {
        isManager: false,
        isAuditor: false,
        isBillingManager: false,
        isUser: false,
        spaceGuids: [
          testSpaceGuid
        ]
      }
    },
    {
      guid: generalGuid,
      roles: {
        isManager: false,
        isAuditor: false,
        isBillingManager: false,
        isUser: false,
        spaceGuids: [
          generalGuid
        ]
      }
    }]);
    toEqual.organizations = orgState.organizations;
    expect(cfPermissions).toEqual(toEqual);
  });

  it('should retain other space and org roles', () => {
    let state = currentCfUserRolesReducer(undefined, getSpaceAction(CfUserRelationTypes.SPACES));
    state = currentCfUserRolesReducer(state, getSpaceAction(CfUserRelationTypes.MANAGED_SPACES, generalGuid, generalGuid));
    state = currentCfUserRolesReducer(state, getOrgAction(CfUserRelationTypes.ORGANIZATIONS));
    state = currentCfUserRolesReducer(state, getOrgAction(CfUserRelationTypes.AUDITED_ORGANIZATIONS, generalGuid));
    const cfPermissions = state[testCFEndpointGuid];


    const spaceState = getState(RoleEntities.SPACES, [{
      guid: testSpaceGuid,
      roles: {
        orgId: testOrgGuid,
        isManager: false,
        isAuditor: false,
        isDeveloper: true
      }
    },
    {
      guid: generalGuid,
      roles: {
        orgId: generalGuid,
        isManager: true,
        isAuditor: false,
        isDeveloper: false
      }
    }]);

    const orgState = getState(RoleEntities.ORGS, [{
      guid: testOrgGuid,
      roles: {
        isManager: false,
        isAuditor: false,
        isBillingManager: false,
        isUser: true,
        spaceGuids: [
          testSpaceGuid
        ]
      }
    },
    {
      guid: generalGuid,
      roles: {
        isManager: false,
        isAuditor: true,
        isBillingManager: false,
        isUser: false,
        spaceGuids: [
          generalGuid
        ]
      }
    }]);
    spaceState.organizations = orgState.organizations;
    expect(cfPermissions).toEqual(spaceState);
  });
});
