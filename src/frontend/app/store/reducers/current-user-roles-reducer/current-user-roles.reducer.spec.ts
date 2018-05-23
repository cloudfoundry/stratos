import { currentUserRolesReducer } from './current-user-roles.reducer';
import { Action } from '@ngrx/store';
import { GetCurrentUserRelationsComplete, UserRelationTypes } from '../../actions/permissions.actions';
import { isOrgRelation } from './current-user-reducer.helpers';
import { APIResource } from '../../types/api.types';
import { ISpaceRoleState, IOrgRoleState, ICfRolesState, getDefaultEndpointRoles } from '../../types/current-user-roles.types';

const testOrgGuid = 'org-1';
const testSpaceGuid = 'space-1';
const generalGuid = 'guid-123';
const testCFEndpointGuid = 'cf-1';

function getAction(type: UserRelationTypes, guidOverride?: string) {
  let guid = guidOverride;
  if (!guid) {
    guid = testSpaceGuid;
    if (isOrgRelation(type)) {
      guid = testOrgGuid;
    }
  }
  return new GetCurrentUserRelationsComplete(
    type,
    testCFEndpointGuid,
    [{ metadata: { guid, created_at: '1', updated_at: '1', url: '1' }, entity: {} }]
  );
}

function getState(
  orgOrSpace: 'organizations' | 'spaces',
  allRoles: { guid: string, roles: ISpaceRoleState | IOrgRoleState }[] = [],
  roles?: ISpaceRoleState | IOrgRoleState
): ICfRolesState {
  const baseState = getDefaultEndpointRoles();
  if (!allRoles.length) {
    let guid = testSpaceGuid;
    if (orgOrSpace === 'organizations') {
      guid = testOrgGuid;
    }
    allRoles.push({ guid, roles });
  }
  const orgSpaceRoles = {
    [orgOrSpace]: {}
  };
  allRoles.forEach(role => {
    orgSpaceRoles[orgOrSpace][role.guid] = role.roles;
  });
  return {
    ...baseState,
    ...orgSpaceRoles
  };
}

describe('currentUserReducer', () => {
  it('set defaults', () => {
    const state = currentUserRolesReducer(undefined, { type: 'FAKE_ACTION' });
    expect(state).toEqual({
      internal: {
        isAdmin: false,
        scopes: []
      },
      cf: {}
    });
  });
  it('should add org manager role to org', () => {
    const state = currentUserRolesReducer(undefined, getAction(UserRelationTypes.MANAGED_ORGANIZATION));
    const cfPermissions = state.cf[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState('organizations', [], {
      isManager: true,
      isAuditor: false,
      isBillingManager: false,
      isUser: false,
    }));
  });
  it('should add org auditor role to org', () => {
    const state = currentUserRolesReducer(undefined, getAction(UserRelationTypes.AUDITED_ORGANIZATIONS));
    const cfPermissions = state.cf[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState('organizations', [], {
      isManager: false,
      isAuditor: true,
      isBillingManager: false,
      isUser: false,
    }));
  });
  it('should add org billing manager role to org', () => {
    const state = currentUserRolesReducer(undefined, getAction(UserRelationTypes.BILLING_MANAGED_ORGANIZATION));
    const cfPermissions = state.cf[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState('organizations', [], {
      isManager: false,
      isAuditor: false,
      isBillingManager: true,
      isUser: false,
    }));
  });
  it('should add org user role to org', () => {
    const state = currentUserRolesReducer(undefined, getAction(UserRelationTypes.ORGANIZATIONS));
    const cfPermissions = state.cf[testCFEndpointGuid];
    expect(cfPermissions).toEqual(getState('organizations', [], {
      isManager: false,
      isAuditor: false,
      isBillingManager: false,
      isUser: true,
    }));
  });

  it('should retain other org roles', () => {
    let state = currentUserRolesReducer(undefined, getAction(UserRelationTypes.ORGANIZATIONS));
    state = currentUserRolesReducer(state, getAction(UserRelationTypes.AUDITED_ORGANIZATIONS, generalGuid));
    const cfPermissions = state.cf[testCFEndpointGuid];
    const toEqual = getState('organizations', [{
      guid: testOrgGuid,
      roles: {
        isManager: false,
        isAuditor: false,
        isBillingManager: false,
        isUser: true,
      }
    },
    {
      guid: generalGuid,
      roles: {
        isManager: false,
        isAuditor: true,
        isBillingManager: false,
        isUser: false,
      }
    }]);
    expect(cfPermissions).toEqual(toEqual);
  });

  it('should retain other space roles', () => {
    let state = currentUserRolesReducer(undefined, getAction(UserRelationTypes.SPACES));
    state = currentUserRolesReducer(state, getAction(UserRelationTypes.MANAGED_SPACES, generalGuid));
    const cfPermissions = state.cf[testCFEndpointGuid];
    const toEqual = getState('spaces', [{
      guid: testSpaceGuid,
      roles: {
        isManager: false,
        isAuditor: false,
        isDeveloper: true
      }
    },
    {
      guid: generalGuid,
      roles: {
        isManager: true,
        isAuditor: false,
        isDeveloper: false
      }
    }]);
    expect(cfPermissions).toEqual(toEqual);
  });

  it('should retain other space and org roles', () => {
    let state = currentUserRolesReducer(undefined, getAction(UserRelationTypes.SPACES));
    state = currentUserRolesReducer(state, getAction(UserRelationTypes.MANAGED_SPACES, generalGuid));
    state = currentUserRolesReducer(state, getAction(UserRelationTypes.ORGANIZATIONS));
    state = currentUserRolesReducer(state, getAction(UserRelationTypes.AUDITED_ORGANIZATIONS, generalGuid));
    const cfPermissions = state.cf[testCFEndpointGuid];
    const spaceState = getState('spaces', [{
      guid: testSpaceGuid,
      roles: {
        isManager: false,
        isAuditor: false,
        isDeveloper: true
      }
    },
    {
      guid: generalGuid,
      roles: {
        isManager: true,
        isAuditor: false,
        isDeveloper: false
      }
    }]);

    const orgState = getState('organizations', [{
      guid: testOrgGuid,
      roles: {
        isManager: false,
        isAuditor: false,
        isBillingManager: false,
        isUser: true,
      }
    },
    {
      guid: generalGuid,
      roles: {
        isManager: false,
        isAuditor: true,
        isBillingManager: false,
        isUser: false,
      }
    }]);
    spaceState.organizations = orgState.organizations;
    expect(cfPermissions).toEqual(spaceState);
  });
});
