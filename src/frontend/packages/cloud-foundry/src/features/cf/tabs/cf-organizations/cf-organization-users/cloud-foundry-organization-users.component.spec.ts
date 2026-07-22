import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundryOrganizationUsersComponent } from './cloud-foundry-organization-users.component';
import {
  CfUsersSignalConfigService,
} from '../../../../../shared/signal-list-configs/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { UserInviteService } from '../../../user-invites/user-invite.service';
import type { StUser } from '../../../../../services/endpoint-data/stratos-types';

function makeStubSignalConfigService(opts?: {
  filteredItems?: StUser[];
}) {
  const pageIndex = signal(0);
  const pageSize = signal(25);
  const filterSig = signal(() => true);
  const sortSig = signal({ field: 'username' as const, direction: 'asc' as const });
  const filteredItemsSig = signal<StUser[]>(opts?.filteredItems ?? []);
  const view = {
    pagedItems: signal<StUser[]>([]).asReadonly(),
    totalItems: signal(0).asReadonly(),
    totalFilteredResults: signal(0).asReadonly(),
    totalPages: signal(1).asReadonly(),
    filteredItems: filteredItemsSig.asReadonly(),
    _filteredItemsWritable: filteredItemsSig,
  };
  return {
    initialize: vi.fn(),
    initializeForOrg: vi.fn(),
    initializeForSpace: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    clearFilters: vi.fn(),
    registerSortExtractor: vi.fn(),
    filter: filterSig,
    sort: sortSig,
    pageSize,
    pageIndex,
    view,
    nameFilter: signal(''),
    viewMode: signal<'card' | 'table'>('table'),
    orgNameByGuid: signal(new Map<string, string>()).asReadonly(),
    spaceNameByGuid: signal(new Map<string, string>()).asReadonly(),
    hasLoadedOnce: signal(true).asReadonly(),
  };
}

describe('CloudFoundryOrganizationUsersComponent', () => {
  let component: CloudFoundryOrganizationUsersComponent;
  let fixture: ComponentFixture<CloudFoundryOrganizationUsersComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;

  beforeEach(async () => {
    stubSignalConfig = makeStubSignalConfigService();
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryOrganizationUsersComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        TabNavService,
        { provide: CfUsersSignalConfigService, useValue: stubSignalConfig },
        { provide: CloudFoundryEndpointService, useValue: { cfGuid: 'cnsi-1' } },
        {
          provide: CloudFoundryOrganizationService,
          useValue: { orgGuid: 'org-1', cfGuid: 'cnsi-1', orgDataService: { org: signal(null) } },
        },
        { provide: UserInviteService, useValue: { configured$: of(false) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundryOrganizationUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes the signal config for this org (pinned scope)', () => {
    expect(stubSignalConfig.initializeForOrg).toHaveBeenCalledWith('cnsi-1', 'org-1');
  });

  it('builds a SignalListConfig with the per-org columns (no actions column)', () => {
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.columns.map(c => c.header)).toEqual([
      '', 'Username', 'Origin', 'Org Roles', 'Space Roles', 'Created',
    ]);
    expect(cfg!.getRowKey({
      cnsiGuid: 'cnsi-1', guid: 'user-1', username: 'alice',
      orgRoles: [], spaceRoles: [],
    } as any)).toBe('cnsi-1:user-1');
  });

  it('Org Roles column narrows to roles in THIS org only', () => {
    const cfg = component.listConfig();
    const col = cfg!.columns.find(c => c.key === 'orgRoles');
    expect(col).toBeDefined();
    const inThisOrg: any = {
      cnsiGuid: 'cnsi-1', guid: 'user-1', username: 'alice',
      orgRoles: [
        { orgGuid: 'org-1', roles: ['manager', 'auditor'] },
        { orgGuid: 'org-other', roles: ['user'] },
      ],
      spaceRoles: [],
    };
    expect(col!.render!(inThisOrg)).toBe('manager, auditor');
    const notInThisOrg: any = {
      cnsiGuid: 'cnsi-1', guid: 'user-2', username: 'bob',
      orgRoles: [{ orgGuid: 'org-other', roles: ['manager'] }],
      spaceRoles: [],
    };
    expect(col!.render!(notInThisOrg)).toBe('—');
  });

  it('Space Roles column narrows to spaces under THIS org', () => {
    const cfg = component.listConfig();
    const col = cfg!.columns.find(c => c.key === 'spaceRoles');
    expect(col).toBeDefined();
    const user: any = {
      cnsiGuid: 'cnsi-1', guid: 'user-1', username: 'alice',
      orgRoles: [],
      spaceRoles: [
        { orgGuid: 'org-1', spaceGuid: 'space-a', roles: ['developer'] },
        { orgGuid: 'org-other', spaceGuid: 'space-b', roles: ['auditor'] },
      ],
    };
    // space-a's name doesn't resolve in the stub map — falls back to short
    // form (no_raw_guids rule).
    expect(col!.render!(user)).toBe('space-a: developer');
    const noneInOrg: any = {
      cnsiGuid: 'cnsi-1', guid: 'user-2', username: 'bob',
      orgRoles: [],
      spaceRoles: [{ orgGuid: 'org-other', spaceGuid: 'space-b', roles: ['auditor'] }],
    };
    expect(col!.render!(noneInOrg)).toBe('—');
  });
});

// ─── subNavActions ───────────────────────────────────────────────────────────

async function makeSubNavFixture(canReturn: boolean, filteredItems?: StUser[]): Promise<{
  component: CloudFoundryOrganizationUsersComponent;
  fixture: ComponentFixture<CloudFoundryOrganizationUsersComponent>;
  stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;
}> {
  const stubSignalConfig = makeStubSignalConfigService({ filteredItems: filteredItems ?? [] });
  await TestBed.configureTestingModule({
    imports: [CloudFoundryOrganizationUsersComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      provideHttpClient(),
      ...STORE_TEST_PROVIDERS,
      importProvidersFrom(generateCfBaseTestModulesNoShared()),
      TabNavService,
      { provide: CfUsersSignalConfigService, useValue: stubSignalConfig },
      { provide: CloudFoundryEndpointService, useValue: { cfGuid: 'cnsi-1' } },
      {
        provide: CloudFoundryOrganizationService,
        useValue: { orgGuid: 'org-1', cfGuid: 'cnsi-1', orgDataService: { org: signal(null) } },
      },
      { provide: CurrentUserPermissionsService, useValue: { can: () => of(canReturn) } },
      { provide: UserInviteService, useValue: { configured$: of(false) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(CloudFoundryOrganizationUsersComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { component, fixture, stubSignalConfig };
}

describe('CloudFoundryOrganizationUsersComponent — subNavActions', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('exposes three subNavActions with correct dataTest and variant', async () => {
    const { component } = await makeSubNavFixture(true);
    const actions = (component as any).subNavActions as readonly { dataTest?: string; variant?: string }[];
    expect(actions).toHaveLength(3);
    const addUser = actions.find(a => a.dataTest === 'cf-users-add');
    const manageRoles = actions.find(a => a.dataTest === 'cf-org-users-bulk-manage-roles');
    const removeOrgSpaces = actions.find(a => a.dataTest === 'cf-org-users-bulk-remove-org-spaces');
    expect(addUser).toBeDefined();
    expect(manageRoles).toBeDefined();
    expect(removeOrgSpaces).toBeDefined();
    expect(addUser!.variant).toBe('default');
    expect(manageRoles!.variant).toBe('primary');
    expect(removeOrgSpaces!.variant).toBe('destructive');
  });

  it('sets disabledReason on selection-gated subNavActions', async () => {
    const { component } = await makeSubNavFixture(true);
    const actions = (component as any).subNavActions as readonly { dataTest?: string; disabledReason?: string }[];
    const selectionGated = actions.filter(a => a.dataTest !== 'cf-users-add');
    for (const a of selectionGated) {
      expect(a.disabledReason).toBeTruthy();
    }
  });

  it('listConfig has no bulkActions', async () => {
    const { component } = await makeSubNavFixture(true);
    const cfg = component.listConfig();
    expect(cfg!.bulkActions == null || cfg!.bulkActions!.length === 0).toBe(true);
  });

  it('selectedCount() reflects _selectedUserKeys size', async () => {
    const { component } = await makeSubNavFixture(true);
    const c = component as any;
    expect(c.selectedCount()).toBe(0);
    c._selectedUserKeys.set(new Set(['cnsi-1:u1', 'cnsi-1:u2']));
    expect(c.selectedCount()).toBe(2);
  });

  it('clearSelection() empties _selectedUserKeys', async () => {
    const { component } = await makeSubNavFixture(true);
    const c = component as any;
    c._selectedUserKeys.set(new Set(['cnsi-1:u1']));
    expect(c._selectedUserKeys().size).toBe(1);
    c.clearSelection();
    expect(c._selectedUserKeys().size).toBe(0);
  });
});

// ─── manage-roles gating ─────────────────────────────────────────────────────

function subNavManageAction(component: CloudFoundryOrganizationUsersComponent) {
  const actions = (component as any).subNavActions as readonly { dataTest?: string; disabled?: () => boolean }[];
  return actions.find(a => a.dataTest === 'cf-org-users-bulk-manage-roles')!;
}

describe('CloudFoundryOrganizationUsersComponent — manage-roles gating', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('disables Manage Roles when nothing is selected (even with permission)', async () => {
    const { component } = await makeSubNavFixture(true);
    (component as any)._selectedUserKeys.set(new Set());
    expect(subNavManageAction(component).disabled!()).toBe(true);
  });

  it('enables Manage Roles when users are selected and the user may change roles', async () => {
    const { component } = await makeSubNavFixture(true);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:user-1']));
    expect(subNavManageAction(component).disabled!()).toBe(false);
  });

  it('disables Manage Roles when the user may NOT change roles, regardless of selection', async () => {
    const { component } = await makeSubNavFixture(false);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:user-1']));
    expect(subNavManageAction(component).disabled!()).toBe(true);
  });
});

// ─── bulk remove ──────────────────────────────────────────────────────────────

const userWithOrgRole: StUser = {
  guid: 'u1', cnsiGuid: 'cnsi-1', username: 'alice',
  orgRoles: [{ orgGuid: 'org-1', roles: ['manager'] }],
  spaceRoles: [],
} as any;

const userWithNoRole: StUser = {
  guid: 'u2', cnsiGuid: 'cnsi-1', username: 'bob',
  orgRoles: [],
  spaceRoles: [],
} as any;

describe('CloudFoundryOrganizationUsersComponent — bulk remove', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function subNavAction(component: CloudFoundryOrganizationUsersComponent, dt: string) {
    const actions = (component as any).subNavActions as readonly { dataTest?: string; disabled?: () => boolean }[];
    return actions.find(a => a.dataTest === dt)!;
  }

  it('exposes Remove from Org and Spaces in subNavActions', async () => {
    const { component } = await makeSubNavFixture(true);
    expect(subNavAction(component, 'cf-org-users-bulk-remove-org-spaces')).toBeTruthy();
  });

  it('disables Remove from Org and Spaces when selection is empty', async () => {
    const { component } = await makeSubNavFixture(true);
    (component as any)._selectedUserKeys.set(new Set());
    expect(subNavAction(component, 'cf-org-users-bulk-remove-org-spaces').disabled!()).toBe(true);
  });

  it('disables Remove from Org and Spaces when canManageRoles is false', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(false, [userWithOrgRole]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithOrgRole]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u1']));
    expect(subNavAction(component, 'cf-org-users-bulk-remove-org-spaces').disabled!()).toBe(true);
  });

  it('disables Remove from Org and Spaces when selected user has no role in this org', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(true, [userWithNoRole]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithNoRole]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u2']));
    expect(subNavAction(component, 'cf-org-users-bulk-remove-org-spaces').disabled!()).toBe(true);
  });

  it('enables Remove from Org and Spaces when selected user has an org role', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(true, [userWithOrgRole]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithOrgRole]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u1']));
    expect(subNavAction(component, 'cf-org-users-bulk-remove-org-spaces').disabled!()).toBe(false);
  });

  it('drops the per-row kebab (no actions column)', async () => {
    const { component } = await makeSubNavFixture(true);
    expect(component.listConfig()!.columns.find(c => c.key === 'actions')).toBeUndefined();
  });
});

// ─── Add User action ─────────────────────────────────────────────────────────

describe('CloudFoundryOrganizationUsersComponent — Add User action', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('exposes an always-visible, gated Add User action', async () => {
    const { component } = await makeSubNavFixture(true);
    const actions = (component as any).subNavActions as readonly { dataTest?: string; variant?: string; visible?: () => boolean; disabled?: () => boolean }[];
    const add = actions.find(a => a.dataTest === 'cf-users-add');
    expect(add).toBeTruthy();
    expect(add!.variant).toBe('default');
    expect(add!.visible!()).toBe(true);
    expect(add!.disabled!()).toBe(false);
  });

  it('hides and disables Add User when canManageRoles is false', async () => {
    const { component } = await makeSubNavFixture(false);
    const actions = (component as any).subNavActions as readonly { dataTest?: string; visible?: () => boolean; disabled?: () => boolean }[];
    const add = actions.find(a => a.dataTest === 'cf-users-add');
    expect(add!.visible!()).toBe(false);
    expect(add!.disabled!()).toBe(true);
  });

  it('Add User is NOT gated on selection', async () => {
    const { component } = await makeSubNavFixture(true);
    (component as any)._selectedUserKeys.set(new Set());
    const actions = (component as any).subNavActions as readonly { dataTest?: string; visible?: () => boolean; disabled?: () => boolean }[];
    const add = actions.find(a => a.dataTest === 'cf-users-add');
    expect(add!.visible!()).toBe(true);
    expect(add!.disabled!()).toBe(false);
  });
});
