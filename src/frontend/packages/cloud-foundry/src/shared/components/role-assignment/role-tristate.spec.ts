import { computeChecked, diffToChanges, RoleSelection } from './role-tristate';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';

const u = (guid: string, username = guid) => ({ guid, username } as any);

describe('computeChecked', () => {
  it('single user pre-reflects the baseline (checked)', () => {
    const baseline = { u1: { o1: { permissions: { managers: true } } } } as any;
    expect(computeChecked(OrgUserRoleNames.MANAGER, [u('u1')], baseline, {}, 'o1')).toBe(true);
  });
  it('multi-user: all have → true, some → null, none → false', () => {
    const baseline = { u1: { o1: { permissions: { managers: true } } }, u2: { o1: { permissions: { managers: true } } } } as any;
    expect(computeChecked(OrgUserRoleNames.MANAGER, [u('u1'), u('u2')], baseline, {}, 'o1')).toBe(true);
    const mixed = { u1: { o1: { permissions: { managers: true } } }, u2: { o1: { permissions: {} } } } as any;
    expect(computeChecked(OrgUserRoleNames.MANAGER, [u('u1'), u('u2')], mixed, {}, 'o1')).toBe(null);
    const none = { u1: { o1: { permissions: {} } } } as any;
    expect(computeChecked(OrgUserRoleNames.MANAGER, [u('u1')], none, {}, 'o1')).toBe(false);
  });
  it('an explicit user selection overrides the baseline', () => {
    const baseline = { u1: { o1: { permissions: { managers: true } } } } as any;
    const selection: RoleSelection = { o1: { orgGuid: 'o1', orgName: 'O1', orgRoles: { managers: false }, spaces: {} } };
    expect(computeChecked(OrgUserRoleNames.MANAGER, [u('u1')], baseline, selection, 'o1')).toBe(false);
  });
});

describe('diffToChanges', () => {
  it('untouched selection (including indeterminate) yields no changes', () => {
    const baseline = { u1: { o1: { permissions: { managers: true } } }, u2: { o1: { permissions: {} } } } as any;
    expect(diffToChanges([u('u1'), u('u2')], baseline, {})).toEqual([]);
  });
  it('checking a role grants only to the users who lacked it', () => {
    const baseline = { u1: { o1: { permissions: { managers: true } } }, u2: { o1: { permissions: {} } } } as any;
    const selection: RoleSelection = { o1: { orgGuid: 'o1', orgName: 'O1', orgRoles: { managers: true }, spaces: {} } };
    const changes = diffToChanges([u('u1'), u('u2')], baseline, selection);
    // u1 already manager → no change; u2 → add:true manager
    expect(changes).toEqual([expect.objectContaining({ userGuid: 'u2', orgGuid: 'o1', role: OrgUserRoleNames.MANAGER, add: true })]);
  });
  it('unchecking a held role removes only from the users who had it', () => {
    const baseline = { u1: { o1: { permissions: { managers: true } } }, u2: { o1: { permissions: {} } } } as any;
    const selection: RoleSelection = { o1: { orgGuid: 'o1', orgName: 'O1', orgRoles: { managers: false }, spaces: {} } };
    const changes = diffToChanges([u('u1'), u('u2')], baseline, selection);
    expect(changes).toEqual([expect.objectContaining({ userGuid: 'u1', orgGuid: 'o1', role: OrgUserRoleNames.MANAGER, add: false })]);
  });
  it('emits space_supporter changes', () => {
    const baseline = { u1: { o1: { permissions: {}, spaces: {} } } } as any;
    const selection: RoleSelection = { o1: { orgGuid: 'o1', orgName: 'O1', orgRoles: {},
      spaces: { s1: { spaceName: 'S1', roles: { supporters: true } } } } };
    const changes = diffToChanges([u('u1')], baseline, selection);
    expect(changes).toEqual([expect.objectContaining({ userGuid: 'u1', orgGuid: 'o1', spaceGuid: 's1', role: SpaceUserRoleNames.SUPPORTER, add: true })]);
  });
});
