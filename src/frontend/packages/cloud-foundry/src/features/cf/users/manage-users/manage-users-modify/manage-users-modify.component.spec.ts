import { provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';

import { OrgUserRoleNames } from '../../../../../store/types/cf-user.types';
import { RoleAssignmentDriver } from '../../../../../shared/components/role-assignment/role-assignment.test-deps';

import { CurrentUserPermissionsService } from '@stratosui/core';

import { TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities, CfUserServiceTestProvider } from '@test-framework/cf';
import { CloudFoundryReducersModule } from '../../../../../store/cloud-foundry.reducers.module';
import { TabNavService } from '@stratosui/core';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import { CfRolesService } from '../cf-roles.service';
import { UsersRolesModifyComponent } from './manage-users-modify.component';
import { StUser } from '../../../../../services/endpoint-data/stratos-types';
import { CfRoleChange } from '../../../../../store/types/users-roles.types';

const mockUser1: StUser = {
  guid: 'user-1',
  username: 'alice',
  admin: false,
  active: true,
  cnsiGuid: 'cfGuid',
  orgRoles: {},
  spaceRoles: {},
};
const mockUser2: StUser = {
  guid: 'user-2',
  username: 'bob',
  admin: false,
  active: true,
  cnsiGuid: 'cfGuid',
  orgRoles: {},
  spaceRoles: {},
};

const mockExistingRoles = { 'user-1': { 'org-1': { orgGuid: 'org-1', name: 'Org 1', permissions: {}, spaces: {} } } };

function buildTestBed(activeRoute: Partial<ActiveRouteCfOrgSpace>) {
  const mockOrgEntity = {
    entity: {
      metadata: { guid: 'org-guid', created_at: '', updated_at: '', url: '' },
      entity: { name: 'Test Org', guid: 'org-guid' }
    },
    entityRequestInfo: { fetching: false }
  };

  const mockCfRolesService = {
    loading$: new BehaviorSubject<boolean>(false).asObservable(),
    existingRoles$: new BehaviorSubject<any>(mockExistingRoles).asObservable(),
    newRoles$: new BehaviorSubject<any>({}).asObservable(),
    fetchOrg: vi.fn().mockReturnValue(of(
      { entity: null, entityRequestInfo: { fetching: true } },
      mockOrgEntity,
    )),
    fetchOrgEntity: vi.fn().mockReturnValue(of(mockOrgEntity.entity)),
    fetchOrgs: vi.fn().mockReturnValue(of([mockOrgEntity.entity])),
    fetchSpacesForOrg: vi.fn().mockReturnValue(of([])),
    createRolesDiff: vi.fn().mockReturnValue(of([]))
  };

  const mockUserPerms = {
    can: vi.fn().mockReturnValue(of(true)),
  };

  TestBed.configureTestingModule({
    imports: [
      UsersRolesModifyComponent,
    ],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      provideHttpClient(),
      provideNoopAnimations(),
      ...STORE_TEST_PROVIDERS,
      importProvidersFrom(
        HttpClientTestingModule,
        EntityCatalogTestModule,
        CloudFoundryReducersModule
      ),
      {
        provide: TEST_CATALOGUE_ENTITIES,
        useValue: [
          ...generateStratosEntities(),
          ...generateCFEntities()
        ]
      },
      EntityCatalogHelper,
      CfUserServiceTestProvider,
      { provide: CfRolesService, useValue: mockCfRolesService },
      { provide: CurrentUserPermissionsService, useValue: mockUserPerms },
      TabNavService,
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: { breadcrumbs: 'key' },
            params: {}
          }
        }
      },
      {
        provide: ActiveRouteCfOrgSpace,
        useValue: {
          cfGuid: 'cfGuid',
          ...activeRoute,
        }
      },
    ],
  })
    .compileComponents();

  const helper = TestBed.inject(EntityCatalogHelper);
  EntityCatalogHelpers.SetEntityCatalogHelper(helper);
}

describe('UsersRolesModifyComponent', () => {
  let component: UsersRolesModifyComponent;
  let fixture: ComponentFixture<UsersRolesModifyComponent>;

  beforeEach(() => {
    buildTestBed({ orgGuid: 'orgGuid', spaceGuid: 'spaceGuid' });

    fixture = TestBed.createComponent(UsersRolesModifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('seeds the org context on org-scoped entry despite fetchOrg emitting its placeholder first', () => {
    const rolesData = TestBed.inject(CfUsersRolesDataService);
    expect(rolesData.newRoles().orgGuid).toBe('orgGuid');
    expect(rolesData.newRoles().name).toBe('Test Org');
  });

  it('renders the role-assignment widget seeded with current users + baseline', async () => {
    const rolesData = TestBed.inject(CfUsersRolesDataService);
    // Seed two users so the widget gets a non-empty users array
    rolesData.setUsers('cfGuid', [mockUser1, mockUser2]);
    fixture.detectChanges();
    await fixture.whenStable();

    // The widget element should be present in the DOM
    const el: HTMLElement = fixture.nativeElement;
    const widget = el.querySelector('app-role-assignment');
    expect(widget).toBeTruthy();

    // Component exposes the baseline signal sourced from existingRoles$
    expect(component.baseline()).toEqual(mockExistingRoles);

    // Users come from rolesData.users (a signal)
    expect(component.rolesDataUsers()).toHaveLength(2);
  });

  it('pushes the widget changeSet into rolesData.setChanges', () => {
    const rolesData = TestBed.inject(CfUsersRolesDataService);
    const change: CfRoleChange = {
      userGuid: 'user-1',
      orgGuid: 'org-1',
      add: true,
      role: 'managers' as any,
      orgName: 'Org 1',
    };

    component.onChangeSet([change]);

    expect(rolesData.changedRoles()).toEqual([change]);
    expect(component.blocked()).toBe(false);
  });

  it('sets blocked=true when changeSet is empty', () => {
    component.onChangeSet([]);
    expect(component.blocked()).toBe(true);
  });
});

describe('UsersRolesModifyComponent — org-scoped (lockedOrg)', () => {
  let component: UsersRolesModifyComponent;
  let fixture: ComponentFixture<UsersRolesModifyComponent>;

  beforeEach(() => {
    buildTestBed({ orgGuid: 'org-guid-locked', spaceGuid: '' });

    fixture = TestBed.createComponent(UsersRolesModifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('locks the org when launched at org/space scope', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    // lockedOrg should be set with orgGuid from activeRouteCfOrgSpace
    const locked = component.lockedOrg();
    expect(locked).toBeDefined();
    expect(locked?.guid).toBe('org-guid-locked');
  });
});

describe('UsersRolesModifyComponent — driver: real widget toggle flows through to rolesData', () => {
  // Scope: CF-level (no orgGuid) so the org picker is visible and the driver can use it.
  // The mock CfRolesService.fetchOrgs returns a single org 'Test Org' / 'org-guid'.
  // Seeding a real user makes diffToChanges produce a non-empty change set.
  let component: UsersRolesModifyComponent;
  let fixture: ComponentFixture<UsersRolesModifyComponent>;

  beforeEach(async () => {
    buildTestBed({ orgGuid: '', spaceGuid: '' }); // CF-level: no locked org

    fixture = TestBed.createComponent(UsersRolesModifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('toggling Manager via the real widget DOM updates rolesData.changedRoles()', async () => {
    const rolesData = TestBed.inject(CfUsersRolesDataService);

    // Seed a user so diffToChanges has a non-empty user list to iterate over.
    rolesData.setUsers('cfGuid', [mockUser1]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Use the shared DOM driver to pick the org then toggle the Manager role.
    const driver = new RoleAssignmentDriver(fixture);
    driver.pickOrg('Test Org');
    await fixture.whenStable();
    fixture.detectChanges();

    driver.toggleOrgRole('org-guid', 'Manager');
    fixture.detectChanges();

    // The widget emits changeSet → UsersRolesModifyComponent.onChangeSet stores it
    // in rolesData.setChanges. Verify the change landed with the correct role.
    const changes = rolesData.changedRoles();
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.some(c => c.role === OrgUserRoleNames.MANAGER && c.add === true)).toBe(true);
  });
});
