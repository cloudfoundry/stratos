import { buildAddChanges } from './cf-users-add';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';

describe('buildAddChanges', () => {
  it('emits add:true org + space changes for each user', () => {
    const changes = buildAddChanges(['u1', 'u2'], {
      orgGuid: 'o1', orgName: 'Org One',
      spaceNameByGuid: new Map([['s1', 'Space One']]),
      selection: { orgRoles: [OrgUserRoleNames.MANAGER], spaceRolesBySpace: { s1: [SpaceUserRoleNames.DEVELOPER] } },
    });
    // 2 users × (1 org role + 1 space role) = 4 changes, all add:true
    expect(changes.length).toBe(4);
    expect(changes.every(c => c.add === true)).toBe(true);
    expect(changes.filter(c => c.spaceGuid === 's1' && c.role === SpaceUserRoleNames.DEVELOPER).length).toBe(2);
    expect(changes.filter(c => !c.spaceGuid && c.role === OrgUserRoleNames.MANAGER).length).toBe(2);
  });

  it('returns [] when no roles selected', () => {
    expect(buildAddChanges(['u1'], { orgGuid: 'o1', orgName: 'Org One', selection: { orgRoles: [], spaceRolesBySpace: {} } })).toEqual([]);
  });
});
