import {
  GetCurrentUserRelationsComplete,
  UserRelationTypes,
} from '../../../../cloud-foundry/src/actions/permissions.actions';
import {
  createOrgRoleStateState,
} from '../../../../cloud-foundry/src/store/reducers/current-user-roles-reducer/current-user-roles-org.reducer';
import {
  ICfRolesState,
  IOrgRoleState,
  ISpaceRoleState,
  RoleEntities,
} from '../../../../cloud-foundry/src/store/types/cf-current-user-roles.types';
import {
  getDefaultEndpointRoles,
  getDefaultRolesRequestState,
  ICurrentUserRolesState,
} from '../../types/current-user-roles.types';
import { currentUserRolesReducer } from './current-user-roles.reducer';
import { getDefaultEndpointRoles, ICurrentUserRolesState, getDefaultRolesRequestState } from '../../types/current-user-roles.types';

const testOrgGuid = 'org-1';
const testSpaceGuid = 'space-1';
const generalGuid = 'guid-123';
const testCFEndpointGuid = 'cf-1';

function getSpaceAction(type: UserRelationTypes, orgGuid: string = testOrgGuid, spaceGuid: string = testSpaceGuid) {
  return new GetCurrentUserRelationsComplete(
    type,
    testCFEndpointGuid,
    [{ metadata: { guid: spaceGuid, created_at: '1', updated_at: '1', url: '1' }, entity: { organization_guid: orgGuid } }]
  );
}

function getOrgAction(type: UserRelationTypes, orgGuid: string = testOrgGuid) {
  return new GetCurrentUserRelationsComplete(
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
  const baseState = getDefaultEndpointRoles();
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
      [testOrgGuid]: createOrgRoleStateState()
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

describe('currentUserReducer', () => {
  it('set defaults', () => {
    const state = currentUserRolesReducer(undefined, { type: 'FAKE_ACTION' });
    const expectedState: ICurrentUserRolesState = {
      internal: {
        isAdmin: false,
        scopes: []
      },
      cf: {},
      state: getDefaultRolesRequestState()
    };
    expect(state).toEqual(expectedState);
  });
  it('should add org manager role to org', () => {
    const state = currentUserRolesReducer(undefined, getOrgAction(UserRelationTypes.MANAGED_ORGANIZATION));
    const cfPermissions = state.cf[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState(RoleEntities.ORGS, [], {
      isManager: true,
      isAuditor: false,
      isBillingManager: false,
      isUser: false,
      spaceGuids: []
    }));
  });
  it('should add org auditor role to org', () => {
    const state = currentUserRolesReducer(undefined, getOrgAction(UserRelationTypes.AUDITED_ORGANIZATIONS));
    const cfPermissions = state.cf[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState(RoleEntities.ORGS, [], {
      isManager: false,
      isAuditor: true,
      isBillingManager: false,
      isUser: false,
      spaceGuids: []
    }));
  });
  it('should add org billing manager role to org', () => {
    const state = currentUserRolesReducer(undefined, getOrgAction(UserRelationTypes.BILLING_MANAGED_ORGANIZATION));
    const cfPermissions = state.cf[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState(RoleEntities.ORGS, [], {
      isManager: false,
      isAuditor: false,
      isBillingManager: true,
      isUser: false,
      spaceGuids: []
    }));
  });
  it('should add org user role to org', () => {
    const state = currentUserRolesReducer(undefined, getOrgAction(UserRelationTypes.ORGANIZATIONS));
    const cfPermissions = state.cf[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState(RoleEntities.ORGS, [], {
      isManager: false,
      isAuditor: false,
      isBillingManager: false,
      isUser: true,
      spaceGuids: []
    }));
  });

  it('should retain other org roles', () => {
    let state = currentUserRolesReducer(undefined, getOrgAction(UserRelationTypes.ORGANIZATIONS));
    state = currentUserRolesReducer(state, getOrgAction(UserRelationTypes.AUDITED_ORGANIZATIONS, generalGuid));
    const cfPermissions = state.cf[testCFEndpointGuid];
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
    let state = currentUserRolesReducer(undefined, getSpaceAction(UserRelationTypes.SPACES));
    state = currentUserRolesReducer(state, getSpaceAction(UserRelationTypes.MANAGED_SPACES, generalGuid, generalGuid));
    const cfPermissions = state.cf[testCFEndpointGuid];
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
    let state = currentUserRolesReducer(undefined, getSpaceAction(UserRelationTypes.SPACES));
    state = currentUserRolesReducer(state, getSpaceAction(UserRelationTypes.MANAGED_SPACES, generalGuid, generalGuid));
    state = currentUserRolesReducer(state, getOrgAction(UserRelationTypes.ORGANIZATIONS));
    state = currentUserRolesReducer(state, getOrgAction(UserRelationTypes.AUDITED_ORGANIZATIONS, generalGuid));
    const cfPermissions = state.cf[testCFEndpointGuid];


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
