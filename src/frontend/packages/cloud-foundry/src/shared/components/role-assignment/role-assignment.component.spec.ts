import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { CfRolesService } from '../../../features/cf/users/manage-users/cf-roles.service';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';
import { CfRoleChange } from '../../../store/types/users-roles.types';
import { StUser } from '../../../services/endpoint-data/stratos-types';

import { RoleAssignmentComponent } from './role-assignment.component';

// Minimal StUser factory
function makeUser(guid: string): StUser {
  return { guid, username: `user-${guid}`, cnsiGuid: 'cf1', orgRoles: [], spaceRoles: [] };
}

// Minimal APIResource<IOrganization> factory
function makeOrg(guid: string, name: string) {
  return { metadata: { guid, created_at: '', updated_at: '', url: '' }, entity: { name } };
}

describe('RoleAssignmentComponent', () => {
  let mockCfRolesService: { fetchOrgs: ReturnType<typeof vi.fn>; fetchSpacesForOrg: ReturnType<typeof vi.fn> };
  let mockUserPerms: { can: ReturnType<typeof vi.fn> };

  const cfGuid = 'cf1';
  const o1 = makeOrg('o1', 'Org One');
  const o2 = makeOrg('o2', 'Org Two');
  const space1 = { guid: 's1', name: 'Space One' };

  beforeEach(async () => {
    mockCfRolesService = {
      fetchOrgs: vi.fn().mockReturnValue(of([o1, o2])),
      fetchSpacesForOrg: vi.fn().mockReturnValue(of([space1])),
    };

    // By default: o1 allowed, o2 not allowed
    mockUserPerms = {
      can: vi.fn().mockImplementation((_perm: unknown, _cf: unknown, orgGuid: string) =>
        of(orgGuid === 'o1'),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [RoleAssignmentComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CfRolesService, useValue: mockCfRolesService },
        { provide: CurrentUserPermissionsService, useValue: mockUserPerms },
      ],
    }).compileComponents();
  });

  function createFixture(): ComponentFixture<RoleAssignmentComponent> {
    const fixture = TestBed.createComponent(RoleAssignmentComponent);
    fixture.componentRef.setInput('cfGuid', cfGuid);
    fixture.detectChanges();
    return fixture;
  }

  it('lists only permission-allowed orgs in the multi-select', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    // allowedOrgs should only contain o1 (o2 filtered out by permission)
    expect(component.allowedOrgs()).toEqual([o1]);
    expect(mockUserPerms.can).toHaveBeenCalledWith(
      CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES,
      cfGuid,
      'o1',
    );
    expect(mockUserPerms.can).toHaveBeenCalledWith(
      CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES,
      cfGuid,
      'o2',
    );
  });

  it('materializes a picked org as an accordion section with org + space roles', async () => {
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

    // Should have fetched spaces for o1
    expect(mockCfRolesService.fetchSpacesForOrg).toHaveBeenCalledWith(cfGuid, 'o1');

    // Template: 4 org-role cells
    const orgRoleCells = fixture.debugElement.queryAll(By.css('[data-testid="org-role-cell"]'));
    expect(orgRoleCells.length).toBe(4);

    // Template: 4 space-role cells (incl Supporter) for s1
    const spaceRoleCells = fixture.debugElement.queryAll(By.css('[data-testid="space-role-cell"]'));
    expect(spaceRoleCells.length).toBe(4);
  });

  it('pre-seeds and locks the org when lockedOrg is set', async () => {
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

  it('filters spaces within a section', async () => {
    const fixture = createFixture();
    // Set up two spaces
    mockCfRolesService.fetchSpacesForOrg.mockReturnValue(
      of([{ guid: 's1', name: 'Alpha Space' }, { guid: 's2', name: 'Beta Space' }]),
    );
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
});
