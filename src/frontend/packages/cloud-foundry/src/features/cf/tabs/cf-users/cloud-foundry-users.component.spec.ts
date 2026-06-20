import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundryUsersComponent } from './cloud-foundry-users.component';
import { CfUsersSignalConfigService } from '../../../../shared/signal-list-configs/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StUser } from '../../../../services/endpoint-data/stratos-types';

function makeStubSignalConfigService(opts?: {
  orgNames?: Map<string, string>;
  spaceNames?: Map<string, string>;
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
    selectedOrg: signal<string | null>(null),
    selectedSpace: signal<string | null>(null),
    viewMode: signal<'card' | 'table'>('table'),
    orgNameByGuid: signal(opts?.orgNames ?? new Map<string, string>()).asReadonly(),
    spaceNameByGuid: signal(opts?.spaceNames ?? new Map<string, string>()).asReadonly(),
    orgOptions: signal([{ label: 'All', value: null }]).asReadonly(),
    spaceOptions: signal([{ label: 'All', value: null }]).asReadonly(),
    hasLoadedOnce: signal(true).asReadonly(),
    isLoadingOrgs: signal(false).asReadonly(),
    isLoadingSpaces: signal(false).asReadonly(),
  };
}

describe('CloudFoundryUsersComponent', () => {
  let component: CloudFoundryUsersComponent;
  let fixture: ComponentFixture<CloudFoundryUsersComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;

  beforeEach(async () => {
    stubSignalConfig = makeStubSignalConfigService({
      orgNames: new Map([['org-1', 'engineering'], ['org-2', 'platform']]),
      spaceNames: new Map([['space-1', 'dev'], ['space-2', 'prod']]),
    });
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryUsersComponent,
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundryUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes the signal config for the CNSI', () => {
    expect(stubSignalConfig.initialize).toHaveBeenCalledWith('cnsi-1');
  });

  it('builds a SignalListConfig with the CF-level users columns', () => {
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

  it('Org Roles column resolves org name + joins prefix-stripped roles', () => {
    const cfg = component.listConfig();
    const orgCol = cfg!.columns.find(c => c.key === 'orgRoles');
    expect(orgCol).toBeDefined();
    const orgUser: any = {
      cnsiGuid: 'cnsi-1', guid: 'user-1', username: 'alice',
      orgRoles: [{ orgGuid: 'org-1', roles: ['manager', 'auditor'] }],
      spaceRoles: [],
    };
    expect(orgCol!.render!(orgUser)).toContain('engineering');
    expect(orgCol!.render!(orgUser)).toContain('manager, auditor');
    // Empty bucket → em-dash placeholder.
    const noRoleUser: any = {
      cnsiGuid: 'cnsi-1', guid: 'user-2', username: 'bob',
      orgRoles: [], spaceRoles: [],
    };
    expect(orgCol!.render!(noRoleUser)).toBe('—');
  });

  it('Space Roles column composes "<org>/<space>: roles" via lookup signals', () => {
    const cfg = component.listConfig();
    const spaceCol = cfg!.columns.find(c => c.key === 'spaceRoles');
    expect(spaceCol).toBeDefined();
    const spaceUser: any = {
      cnsiGuid: 'cnsi-1', guid: 'user-3', username: 'carol',
      orgRoles: [],
      spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'space-1', roles: ['developer'] }],
    };
    const text = spaceCol!.render!(spaceUser);
    expect(text).toContain('engineering / dev');
    expect(text).toContain('developer');
  });

  // Note: a previous test asserted on `cfg.headerActions` for an "Invite
  // User" placeholder action. SignalListConfig.headerActions was removed
  // (see commit "Sweep remaining headerActions consumers"); a framework
  // slot for non-add page-level actions is tracked separately. The test
  // is dropped along with the field.
});

describe('CloudFoundryUsersComponent — no broken header actions', () => {
  let component: CloudFoundryUsersComponent;
  let fixture: ComponentFixture<CloudFoundryUsersComponent>;

  beforeEach(async () => {
    const stubSignalConfig = makeStubSignalConfigService();
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryUsersComponent,
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundryUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes no page-level header actions (Invite/Manage moved to selection / later phases)', () => {
    const cfg = component.listConfig();
    expect(cfg!.headerActions ?? []).toEqual([]);
  });
});

// ─── subNavActions ───────────────────────────────────────────────────────────

async function makeSubNavFixture(canReturn: boolean, filteredItems?: StUser[]): Promise<{
  component: CloudFoundryUsersComponent;
  fixture: ComponentFixture<CloudFoundryUsersComponent>;
  stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;
}> {
  const stubSignalConfig = makeStubSignalConfigService({
    orgNames: new Map(),
    spaceNames: new Map(),
    filteredItems: filteredItems ?? [],
  });
  await TestBed.configureTestingModule({
    imports: [CloudFoundryUsersComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      provideHttpClient(),
      ...STORE_TEST_PROVIDERS,
      importProvidersFrom(generateCfBaseTestModulesNoShared()),
      TabNavService,
      { provide: CfUsersSignalConfigService, useValue: stubSignalConfig },
      { provide: CloudFoundryEndpointService, useValue: { cfGuid: 'cnsi-1' } },
      { provide: CurrentUserPermissionsService, useValue: { can: () => of(canReturn) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(CloudFoundryUsersComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { component, fixture, stubSignalConfig };
}

describe('CloudFoundryUsersComponent — subNavActions', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('exposes three subNavActions with correct dataTest and variant', async () => {
    const { component } = await makeSubNavFixture(true);
    const actions = (component as any).subNavActions as readonly { dataTest?: string; variant?: string }[];
    expect(actions).toHaveLength(3);
    const manageRoles = actions.find(a => a.dataTest === 'cf-users-bulk-manage-roles');
    const removeSpaces = actions.find(a => a.dataTest === 'cf-users-bulk-remove-spaces');
    const removeOrgSpaces = actions.find(a => a.dataTest === 'cf-users-bulk-remove-org-spaces');
    expect(manageRoles).toBeDefined();
    expect(removeSpaces).toBeDefined();
    expect(removeOrgSpaces).toBeDefined();
    expect(manageRoles!.variant).toBe('primary');
    expect(removeSpaces!.variant).toBe('destructive');
    expect(removeOrgSpaces!.variant).toBe('destructive');
  });

  it('sets disabledReason on every subNavAction', async () => {
    const { component } = await makeSubNavFixture(true);
    const actions = (component as any).subNavActions as readonly { disabledReason?: string }[];
    for (const a of actions) {
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

// ─── manage-roles gating (sourced from subNavActions) ───────────────────────

function subNavManageAction(component: CloudFoundryUsersComponent) {
  const actions = (component as any).subNavActions as readonly { dataTest?: string; disabled?: () => boolean }[];
  return actions.find(a => a.dataTest === 'cf-users-bulk-manage-roles')!;
}

describe('CloudFoundryUsersComponent — manage-roles gating', () => {
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

// ─── bulk remove (sourced from subNavActions) ────────────────────────────────

const userWithSpaceRole: StUser = {
  guid: 'u1', cnsiGuid: 'cnsi-1', username: 'alice',
  orgRoles: [],
  spaceRoles: [{ spaceGuid: 'space-1', orgGuid: 'org-1', roles: ['developer'] }],
} as any;
const userWithOrgRoleOnly: StUser = {
  guid: 'u2', cnsiGuid: 'cnsi-1', username: 'bob',
  orgRoles: [{ orgGuid: 'org-1', roles: ['manager'] }],
  spaceRoles: [],
} as any;

describe('CloudFoundryUsersComponent — bulk remove', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function subNavAction(component: CloudFoundryUsersComponent, dt: string) {
    const actions = (component as any).subNavActions as readonly { dataTest?: string; disabled?: () => boolean }[];
    return actions.find(a => a.dataTest === dt)!;
  }

  it('exposes Remove from Spaces and Remove from Org + Spaces in subNavActions', async () => {
    const { component } = await makeSubNavFixture(true);
    expect(subNavAction(component, 'cf-users-bulk-remove-spaces')).toBeTruthy();
    expect(subNavAction(component, 'cf-users-bulk-remove-org-spaces')).toBeTruthy();
  });

  it('disables Remove from Spaces when selection is empty', async () => {
    const { component } = await makeSubNavFixture(true);
    (component as any)._selectedUserKeys.set(new Set());
    expect(subNavAction(component, 'cf-users-bulk-remove-spaces').disabled!()).toBe(true);
  });

  it('disables Remove from Spaces when selected user has no space role', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(true, [userWithOrgRoleOnly]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithOrgRoleOnly]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u2']));
    expect(subNavAction(component, 'cf-users-bulk-remove-spaces').disabled!()).toBe(true);
  });

  it('enables Remove from Spaces when a selected user has a space role', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(true, [userWithSpaceRole]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithSpaceRole]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u1']));
    expect(subNavAction(component, 'cf-users-bulk-remove-spaces').disabled!()).toBe(false);
  });

  it('disables Remove from Org and Spaces when selection is empty', async () => {
    const { component } = await makeSubNavFixture(true);
    (component as any)._selectedUserKeys.set(new Set());
    expect(subNavAction(component, 'cf-users-bulk-remove-org-spaces').disabled!()).toBe(true);
  });

  it('disables Remove from Org and Spaces when canManageRoles is false', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(false, [userWithSpaceRole]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithSpaceRole]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u1']));
    expect(subNavAction(component, 'cf-users-bulk-remove-org-spaces').disabled!()).toBe(true);
  });

  it('drops the per-row Remove kebab (no actions column)', async () => {
    const { component } = await makeSubNavFixture(true);
    expect(component.listConfig()!.columns.find(c => c.key === 'actions')).toBeUndefined();
  });
});
