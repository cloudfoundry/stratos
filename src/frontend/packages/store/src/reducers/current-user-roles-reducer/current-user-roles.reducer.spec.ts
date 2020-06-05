import { getDefaultRolesRequestState, ICurrentUserRolesState } from '../../types/current-user-roles.types';
import { currentUserRolesReducer } from './current-user-roles.reducer';

describe('currentUserRolesReducer', () => {
  it('set defaults', () => {
    const state = currentUserRolesReducer(undefined, { type: 'FAKE_ACTION' });
    const expectedState: ICurrentUserRolesState = {
      internal: {
        isAdmin: false,
        scopes: []
      },
      endpoints: {},
      state: getDefaultRolesRequestState()
    };
    expect(state).toEqual(expectedState);
  });
});
