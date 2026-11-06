import { buildRemoveChanges, selectedHasSpaceRole, selectedHasAnyRole } from './cf-users-bulk-remove';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';
import type { StUser } from '../../../services/endpoint-data/stratos-types';

const user = (over: Partial<StUser> = {}): StUser => ({
  guid: 'u1', username: 'alice', cnsiGuid: 'cnsi', orgRoles: [], spaceRoles: [], ...over,
});

describe('buildRemoveChanges', () => {
  it('org+spaces scope emits add:false changes for org and space roles with plural role names', () => {
    const u = user({
      orgRoles: [{ orgGuid: 'o1', roles: ['manager', 'auditor'] }],
      spaceRoles: [{ orgGuid: 'o1', spaceGuid: 's1', roles: ['developer'] }],
    });
    const changes = buildRemoveChanges([u], { scope: 'orgAndSpaces' });
    expect(changes).toEqual(expect.arrayContaining([
      { userGuid: 'u1', orgGuid: 'o1', orgName: '', add: false, role: OrgUserRoleNames.MANAGER },
      { userGuid: 'u1', orgGuid: 'o1', orgName: '', add: false, role: OrgUserRoleNames.AUDITOR },
      { userGuid: 'u1', orgGuid: 'o1', orgName: '', spaceGuid: 's1', spaceName: '', add: false, role: SpaceUserRoleNames.DEVELOPER },
    ]));
    expect(changes).toHaveLength(3);
  });

  it('spaces scope skips org roles', () => {
    const u = user({
      orgRoles: [{ orgGuid: 'o1', roles: ['manager'] }],
      spaceRoles: [{ orgGuid: 'o1', spaceGuid: 's1', roles: ['auditor'] }],
    });
    const changes = buildRemoveChanges([u], { scope: 'spaces' });
    expect(changes).toEqual([
      { userGuid: 'u1', orgGuid: 'o1', spaceGuid: 's1', orgName: '', spaceName: '', add: false, role: SpaceUserRoleNames.AUDITOR },
    ]);
  });

  it('orgGuid lock filters to that org only (org roles + that org\'s space roles)', () => {
    const u = user({
      orgRoles: [{ orgGuid: 'o1', roles: ['manager'] }, { orgGuid: 'o2', roles: ['user'] }],
      spaceRoles: [
        { orgGuid: 'o1', spaceGuid: 's1', roles: ['developer'] },
        { orgGuid: 'o2', spaceGuid: 's2', roles: ['manager'] },
      ],
    });
    const changes = buildRemoveChanges([u], { scope: 'orgAndSpaces', orgGuid: 'o1' });
    expect(changes.map(c => c.orgGuid)).toEqual(['o1', 'o1']);
    expect(changes.some(c => c.spaceGuid === 's2')).toBe(false);
  });

  it('spaceGuid lock filters to that space only', () => {
    const u = user({
      spaceRoles: [
        { orgGuid: 'o1', spaceGuid: 's1', roles: ['developer'] },
        { orgGuid: 'o1', spaceGuid: 's2', roles: ['auditor'] },
      ],
    });
    const changes = buildRemoveChanges([u], { scope: 'spaces', spaceGuid: 's1' });
    expect(changes).toHaveLength(1);
    expect(changes[0].spaceGuid).toBe('s1');
  });

  it('resolves display names from the provided maps', () => {
    const u = user({ orgRoles: [{ orgGuid: 'o1', roles: ['user'] }] });
    const changes = buildRemoveChanges([u], {
      scope: 'orgAndSpaces',
      orgNameByGuid: new Map([['o1', 'Engineering']]),
    });
    expect(changes[0].orgName).toBe('Engineering');
  });

  it('empty role buckets produce no changes', () => {
    expect(buildRemoveChanges([user({ orgRoles: [{ orgGuid: 'o1', roles: [] }] })], { scope: 'orgAndSpaces' })).toEqual([]);
  });
});

describe('gating predicates', () => {
  it('selectedHasSpaceRole true when any user has a space role (optionally for a given space)', () => {
    const u = user({ spaceRoles: [{ orgGuid: 'o1', spaceGuid: 's1', roles: ['developer'] }] });
    expect(selectedHasSpaceRole([u])).toBe(true);
    expect(selectedHasSpaceRole([u], 's1')).toBe(true);
    expect(selectedHasSpaceRole([u], 's2')).toBe(false);
    expect(selectedHasSpaceRole([user()])).toBe(false);
  });

  it('selectedHasAnyRole true when any user has any role (optionally within a given org)', () => {
    const u = user({ orgRoles: [{ orgGuid: 'o1', roles: ['manager'] }] });
    expect(selectedHasAnyRole([u])).toBe(true);
    expect(selectedHasAnyRole([u], 'o1')).toBe(true);
    expect(selectedHasAnyRole([u], 'o2')).toBe(false);
    expect(selectedHasAnyRole([user()])).toBe(false);
  });
});
