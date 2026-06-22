import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';

import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';
import { CfRoleChange } from '../../../store/types/users-roles.types';
import { StUser } from '../../../services/endpoint-data/stratos-types';
import { diffToChanges } from './role-tristate';

import { RoleAssignmentComponent } from './role-assignment.component';
import { provideRoleAssignmentTestDeps, RoleAssignmentTestCfg } from './role-assignment.test-deps';

// Minimal StUser factory
function makeUser(guid: string): StUser {
  return { guid, username: `user-${guid}`, cnsiGuid: 'cf1', orgRoles: [], spaceRoles: [] };
}

// Minimal APIResource<IOrganization> factory
function makeOrg(guid: string, name: string) {
  return { metadata: { guid, created_at: '', updated_at: '', url: '' }, entity: { name } };
}

describe('RoleAssignmentComponent', () => {
  const cfGuid = 'cf1';
  const o1 = makeOrg('o1', 'Org One');
  const o2 = makeOrg('o2', 'Org Two');
  const space1 = { guid: 's1', name: 'Space One' };

  /** Default harness cfg: two orgs, one space under o1, o1 permitted, o2 not. */
  const defaultCfg: RoleAssignmentTestCfg = {
    orgs: [
      { guid: 'o1', name: 'Org One' },
      { guid: 'o2', name: 'Org Two' },
    ],
    spacesByOrg: {
      o1: [{ guid: 's1', name: 'Space One' }],
      o2: [],
    },
    // org-level: o1 allowed, o2 not; space-level: all denied by default
    permissions: (perm, _cf, org) =>
      perm === CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES && org === 'o1',
  };

  async function setup(cfg: RoleAssignmentTestCfg = defaultCfg): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [RoleAssignmentComponent],
      providers: [
        provideZonelessChangeDetection(),
        ...provideRoleAssignmentTestDeps(cfg),
      ],
    }).compileComponents();
  }

  function createFixture(): ComponentFixture<RoleAssignmentComponent> {
    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.detectChanges();
    return fixture;
  }

  it('picker shows all orgs that fetchOrgs returned (fetchOrgs owns the broadened filter)', async () => {
    // The widget trusts fetchOrgs to return only orgs the user can act on.
    // allowedOrgs must NOT re-narrow by org-level edit permission — that would
    // exclude space-manager-only users (the dead-end bug).
    // Default cfg: ORGANIZATION_CHANGE_ROLES true only for o1, but fetchOrgs returns both.
    await setup();
    const fixture = createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    // Both o1 and o2 must appear in the picker (fetchOrgs result is the source of truth).
    expect(component.allowedOrgs()).toEqual([o1, o2]);
    // canEditOrg reflects org-level only: o1=true, o2=false
    expect(component.canEditOrg('o1')).toBe(true);
    expect(component.canEditOrg('o2')).toBe(false);
  });

  it('space-manager-only user: org cells disabled, their space cell enabled', async () => {
    // Scenario: user is space manager of 'spaceA' in orgX, but NOT org manager of orgX.
    // Expected: canEditOrg(orgX)=false, canChangeSpaceRoles(orgX,'spaceA')=true,
    //           canChangeSpaceRoles(orgX,'spaceB')=false.
    await setup({
      orgs: [{ guid: 'orgX', name: 'Org X' }],
      spacesByOrg: {
        orgX: [
          { guid: 'spaceA', name: 'Space A' },
          { guid: 'spaceB', name: 'Space B' },
        ],
      },
      permissions: (perm, _cf, _org, spaceGuid) =>
        perm === CfCurrentUserPermissions.SPACE_CHANGE_ROLES && spaceGuid === 'spaceA',
    });

    const orgX = makeOrg('orgX', 'Org X');

    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    // Org cell gating: only org-level permission (false for orgX)
    expect(component.canEditOrg('orgX')).toBe(false);

    // Pick the org to trigger space loading + per-space permission resolution
    component.pickOrg(orgX);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Space-level permission resolved per-space
    expect(component.canChangeSpaceRoles('orgX', 'spaceA')).toBe(true);
    expect(component.canChangeSpaceRoles('orgX', 'spaceB')).toBe(false);
  });

  it('materializes a picked org as an accordion section with org + space roles', async () => {
    await setup();
    const fixture = createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    // Pick o1
    component.pickOrg(o1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Should have o1 in picked orgs
    expect(component.pickedOrgs()).toEqual([o1]);

    // Spaces were loaded for o1 (verified by checking component state)
    expect(component.spacesFor('o1')).toEqual([space1]);

    // Template: 4 org-role cells
    const orgRoleCells = fixture.debugElement.queryAll(By.css('[data-testid="org-role-cell"]'));
    expect(orgRoleCells.length).toBe(4);

    // Template: 4 space-role cells (incl Supporter) for s1
    const spaceRoleCells = fixture.debugElement.queryAll(By.css('[data-testid="space-role-cell"]'));
    expect(spaceRoleCells.length).toBe(4);
  });

  it('pre-seeds and locks the org when lockedOrg is set', async () => {
    await setup();
    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('lockedOrg', { guid: 'o1', name: 'Org One' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    // pickedOrgs seeded with lockedOrg
    expect(component.pickedOrgs().length).toBe(1);
    expect(component.pickedOrgs()[0].metadata.guid).toBe('o1');

    // multi-select picker is hidden
    const picker = fixture.debugElement.query(By.css('[data-testid="org-picker"]'));
    expect(picker).toBeNull();
  });

  it('emits a changeSet diff when a role cell is toggled', async () => {
    await setup();
    const user = makeUser('u1');
    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('users', [user]);
    fixture.componentRef.setInput('baseline', {});
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;

    const emitted: CfRoleChange[][] = [];
    component.changeSet.subscribe((v: CfRoleChange[]) => emitted.push(v));

    // Pick o1 then toggle Manager
    component.pickOrg(o1);
    fixture.detectChanges();

    component.onToggleOrgRole(o1, OrgUserRoleNames.MANAGER, true);
    fixture.detectChanges();

    expect(emitted.length).toBeGreaterThan(0);
    const lastEmit = emitted[emitted.length - 1];
    expect(lastEmit.length).toBe(1);
    expect(lastEmit[0].userGuid).toBe('u1');
    expect(lastEmit[0].orgGuid).toBe('o1');
    expect(lastEmit[0].role).toBe(OrgUserRoleNames.MANAGER);
    expect(lastEmit[0].add).toBe(true);
  });

  it('collapse does not drop selection edits — state survives toggle', async () => {
    // I1: Prove that collapsing an org accordion never mutates the selection signal.
    await setup();
    const user = makeUser('u1');
    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('users', [user]);
    fixture.componentRef.setInput('baseline', {});
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;

    // Pick o1 (also expands it) and toggle Manager
    component.pickOrg(o1);
    fixture.detectChanges();
    await fixture.whenStable();

    const emitted: CfRoleChange[][] = [];
    component.changeSet.subscribe((v: CfRoleChange[]) => emitted.push(v));

    component.onToggleOrgRole(o1, OrgUserRoleNames.MANAGER, true);
    fixture.detectChanges();

    // Capture the changeSet after toggle
    const changeSetBeforeCollapse = emitted[emitted.length - 1];
    expect(changeSetBeforeCollapse.length).toBe(1);
    expect(changeSetBeforeCollapse[0].role).toBe(OrgUserRoleNames.MANAGER);

    // Collapse the org section (same path the template button uses)
    expect(component.isExpanded('o1')).toBe(true);
    component.toggleExpanded('o1');
    fixture.detectChanges();
    expect(component.isExpanded('o1')).toBe(false);

    // Re-expand
    component.toggleExpanded('o1');
    fixture.detectChanges();
    expect(component.isExpanded('o1')).toBe(true);

    // (a) selection() still contains the toggled Manager role
    const selAfter = component['selection']();
    expect(selAfter['o1']?.orgRoles[OrgUserRoleNames.MANAGER]).toBe(true);

    // (b) A fresh diffToChanges from current selection matches the pre-collapse emit
    const freshChanges = diffToChanges([user], {}, selAfter);
    expect(freshChanges.length).toBe(changeSetBeforeCollapse.length);
    expect(freshChanges[0].role).toBe(changeSetBeforeCollapse[0].role);
    expect(freshChanges[0].add).toBe(changeSetBeforeCollapse[0].add);
  });

  it('isOrgUserDisabled recomputes reactively when baseline changes via setInput', async () => {
    // Prove that orgUserDisabledMap is a reactive computed that re-runs when baseline changes.
    // Start: user u1, empty baseline → org-user NOT disabled.
    // After: inject a baseline with a space-developer role for s1 → org-user BECOMES disabled.
    await setup();
    const user = makeUser('u1');
    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('users', [user]);
    fixture.componentRef.setInput('baseline', {});
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    // Pick o1 so spaces are loaded (space s1 is available via cfg)
    component.pickOrg(o1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Initially no roles in baseline → org-user should NOT be disabled
    expect(component.isOrgUserDisabled('o1')).toBe(false);

    // Now push a baseline where user u1 already has space-developer on s1.
    // CfUserRolesSelected = { [userGuid]: { [orgGuid]: IUserPermissionInOrg } }
    // This means the org-user auto-disable rule should fire.
    const baselineWithSpaceRole = {
      [user.guid]: {
        o1: {
          name: 'Org One',
          orgGuid: 'o1',
          permissions: { managers: false, billing_managers: false, auditors: false, users: false },
          spaces: {
            s1: {
              name: 'Space One',
              orgGuid: 'o1',
              orgName: 'Org One',
              spaceGuid: 's1',
              permissions: { managers: false, developers: true, auditors: false, supporters: false },
            },
          },
        },
      },
    };
    fixture.componentRef.setInput('baseline', baselineWithSpaceRole);
    fixture.detectChanges();

    // The computed orgUserDisabledMap must have re-run; org-user is now disabled
    expect(component.isOrgUserDisabled('o1')).toBe(true);
  });

  it('exposes role defs derived from the registry in the established order', async () => {
    await setup();
    const fixture = createFixture();
    const component = fixture.componentInstance;

    expect(component.orgRoleDefs.map(d => d.label)).toEqual(['Manager', 'Auditor', 'Billing Manager', 'User']);
    expect(component.orgRoleDefs.map(d => d.name)).toEqual([
      OrgUserRoleNames.MANAGER,
      OrgUserRoleNames.AUDITOR,
      OrgUserRoleNames.BILLING_MANAGERS,
      OrgUserRoleNames.USER,
    ]);
    expect(component.spaceRoleDefs.map(d => d.label)).toEqual(['Manager', 'Auditor', 'Developer', 'Supporter']);
    expect(component.spaceRoleDefs.map(d => d.name)).toEqual([
      SpaceUserRoleNames.MANAGER,
      SpaceUserRoleNames.AUDITOR,
      SpaceUserRoleNames.DEVELOPER,
      SpaceUserRoleNames.SUPPORTER,
    ]);
  });

  it('roleCountForOrg counts checked org and space roles', async () => {
    await setup();
    const user = makeUser('u1');
    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('users', [user]);
    fixture.componentRef.setInput('baseline', {});
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;

    // Pick o1 so spaces are loaded (space s1 from the cfg)
    component.pickOrg(o1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Initially no roles set
    expect(component.roleCountForOrg('o1')).toBe(0);

    // Toggle one org role (Manager) and one space role (Developer in s1)
    component.onToggleOrgRole(o1, OrgUserRoleNames.MANAGER, true);
    component.onToggleSpaceRole(o1, { guid: 's1', name: 'Space One' }, SpaceUserRoleNames.DEVELOPER, true);
    fixture.detectChanges();

    expect(component.roleCountForOrg('o1')).toBe(2);
  });

  it('roleCountForOrg returns 1 for a single checked role', async () => {
    await setup();
    const user = makeUser('u1');
    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('users', [user]);
    fixture.componentRef.setInput('baseline', {});
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;

    component.pickOrg(o1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.onToggleOrgRole(o1, OrgUserRoleNames.AUDITOR, true);
    fixture.detectChanges();

    expect(component.roleCountForOrg('o1')).toBe(1);
  });

  it('filters spaces within a section', async () => {
    await setup({
      orgs: [
        { guid: 'o1', name: 'Org One' },
        { guid: 'o2', name: 'Org Two' },
      ],
      spacesByOrg: {
        o1: [
          { guid: 's1', name: 'Alpha Space' },
          { guid: 's2', name: 'Beta Space' },
        ],
        o2: [],
      },
    });
    const fixture = createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.pickOrg(o1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Apply filter
    component.setSpaceFilter('o1', 'Alpha');
    fixture.detectChanges();

    const filtered = component.filteredSpacesFor('o1');
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Alpha Space');
  });

  // ── New behavior tests (Phase 4 role-widget additions) ─────────────────────

  it('A: seeds pickedOrgs from baseline on init (collapsed, not o3)', async () => {
    // Harness has o1, o2, o3; baseline covers o1 and o2 only.
    await setup({
      orgs: [
        { guid: 'o1', name: 'Org One' },
        { guid: 'o2', name: 'Org Two' },
        { guid: 'o3', name: 'Org Three' },
      ],
      spacesByOrg: { o1: [], o2: [], o3: [] },
    });

    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('baseline', {
      user1: {
        o1: { name: 'o1', orgGuid: 'o1', permissions: { managers: false, billing_managers: false, auditors: false, users: true } },
        o2: { name: 'o2', orgGuid: 'o2', permissions: { managers: false, billing_managers: false, auditors: false, users: true } },
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const guids = component.pickedOrgs().map(o => o.metadata.guid);

    // o1 and o2 must be seeded; o3 must NOT be included
    expect(guids).toContain('o1');
    expect(guids).toContain('o2');
    expect(guids).not.toContain('o3');

    // Seeded orgs are collapsed (not expanded)
    expect(component.isExpanded('o1')).toBe(false);
    expect(component.isExpanded('o2')).toBe(false);
  });

  it('A: baseline seed is a no-op when lockedOrg is set', async () => {
    // When lockedOrg is present the baseline seeding effect short-circuits.
    await setup({
      orgs: [{ guid: 'o1', name: 'Org One' }],
      spacesByOrg: { o1: [] },
    });

    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('lockedOrg', { guid: 'o1', name: 'Org One' });
    fixture.componentRef.setInput('baseline', {
      user1: {
        o1: { name: 'o1', orgGuid: 'o1', permissions: { managers: false, billing_managers: false, auditors: false, users: true } },
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    // lockedOrg path seeds o1; the baseline-seeding effect must not run
    expect(component.pickedOrgs().length).toBe(1);
    expect(component.pickedOrgs()[0].metadata.guid).toBe('o1');
    // lockedOrg is always expanded
    expect(component.isExpanded('o1')).toBe(true);
  });

  it('B: roleCountForOrg counts baseline org + space roles without loading spaces', async () => {
    // Baseline has 1 org role (users) + 1 space role (developers) for o1/s1.
    // roleCountForOrg must return 2 WITHOUT having expanded the org (i.e. spacesFor('o1')===[]).
    await setup({
      orgs: [{ guid: 'o1', name: 'Org One' }],
      spacesByOrg: { o1: [{ guid: 's1', name: 'Space One' }] },
    });

    const user = makeUser('u1');
    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('users', [user]);
    fixture.componentRef.setInput('baseline', {
      u1: {
        o1: {
          name: 'Org One',
          orgGuid: 'o1',
          permissions: { managers: false, billing_managers: false, auditors: false, users: true },
          spaces: {
            s1: {
              name: 'Space One',
              orgGuid: 'o1',
              orgName: 'Org One',
              spaceGuid: 's1',
              permissions: { managers: false, developers: true, auditors: false, supporters: false },
            },
          },
        },
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    // Spaces should NOT have been loaded (no expand triggered)
    expect(component.spacesFor('o1')).toEqual([]);

    // Count should still be 2: 1 org role (users) + 1 space role (developers)
    expect(component.roleCountForOrg('o1')).toBe(2);
  });

  it('C: pickOrg prepends — newest pick sits at index 0', async () => {
    await setup({
      orgs: [
        { guid: 'o1', name: 'Org One' },
        { guid: 'o2', name: 'Org Two' },
        { guid: 'o3', name: 'Org Three' },
      ],
      spacesByOrg: { o1: [], o2: [], o3: [] },
    });

    const o3 = makeOrg('o3', 'Org Three');
    const fixture = createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    // Pick o1 first, then o3
    component.pickOrg(o1);
    component.pickOrg(o3);
    fixture.detectChanges();

    expect(component.pickedOrgs()[0].metadata.guid).toBe('o3');
  });

  it('D: toggleExpanded lazy-loads spaces and resolves spacesLoadingFor', async () => {
    // Harness: o1 with s1. Baseline seeds o1 (collapsed). On toggleExpanded('o1')
    // the component should call fetchSpacesForOrg and populate spacesFor('o1').
    let fetchSpacesCalled = false;
    let fetchSpacesOrgGuid = '';

    await TestBed.configureTestingModule({
      imports: [RoleAssignmentComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: (await import('../../../features/cf/users/manage-users/cf-roles.service')).CfRolesService,
          useValue: {
            fetchOrgs: () => {
              const { of } = require('rxjs');
              return of([{ metadata: { guid: 'o1', created_at: '', updated_at: '', url: '' }, entity: { name: 'Org One' } }]);
            },
            fetchSpacesForOrg: (_cf: string, orgGuid: string) => {
              fetchSpacesCalled = true;
              fetchSpacesOrgGuid = orgGuid;
              const { of } = require('rxjs');
              return of([{ guid: 's1', name: 'Space One' }]);
            },
          },
        },
        {
          provide: (await import('../../../../../core/src/core/permissions/current-user-permissions.service')).CurrentUserPermissionsService,
          useValue: { can: () => { const { of } = require('rxjs'); return of(true); } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.componentRef.setInput('baseline', {
      u1: {
        o1: { name: 'Org One', orgGuid: 'o1', permissions: { managers: false, billing_managers: false, auditors: false, users: true } },
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    // o1 is seeded by baseline, collapsed, spaces NOT yet loaded
    expect(component.isExpanded('o1')).toBe(false);
    expect(component.spacesFor('o1')).toEqual([]);

    // Expand o1 — should trigger lazy space load
    component.toggleExpanded('o1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isExpanded('o1')).toBe(true);
    expect(fetchSpacesCalled).toBe(true);
    expect(fetchSpacesOrgGuid).toBe('o1');

    // After the synchronous of() resolves, spaces are populated and loading is cleared
    expect(component.spacesFor('o1')).toEqual([{ guid: 's1', name: 'Space One' }]);
    expect(component.spacesLoadingFor('o1')).toBe(false);
  });

  it('E: orgsLoading is false after ngOnInit resolves', async () => {
    await setup();
    const fixture = createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    // After the synchronous of() from the harness resolves orgsLoading must be false
    expect(component.orgsLoading()).toBe(false);
  });
});
