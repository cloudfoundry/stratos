import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundrySpaceUsersComponent } from './cloud-foundry-space-users.component';
import {
  CfUsersSignalConfigService,
} from '../../../../../../../shared/signal-list-configs/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import type { StUser } from '../../../../../../../services/endpoint-data/stratos-types';

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

describe('CloudFoundrySpaceUsersComponent', () => {
  let component: CloudFoundrySpaceUsersComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceUsersComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;

  beforeEach(async () => {
    stubSignalConfig = makeStubSignalConfigService();
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundrySpaceUsersComponent,
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
        { provide: CloudFoundryOrganizationService, useValue: { orgGuid: 'org-1', cfGuid: 'cnsi-1' } },
        { provide: CloudFoundrySpaceService, useValue: { spaceGuid: 'space-1', orgGuid: 'org-1', cfGuid: 'cnsi-1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundrySpaceUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes the signal config for this space (pinned scope)', () => {
    expect(stubSignalConfig.initializeForSpace).toHaveBeenCalledWith('cnsi-1', 'space-1');
  });

  it('builds a SignalListConfig with the per-space columns (no Org Roles, no actions column)', () => {
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.columns.map(c => c.header)).toEqual([
      '', 'Username', 'Origin', 'Space Roles', 'Created',
    ]);
    expect(cfg!.columns.find(c => c.key === 'orgRoles')).toBeUndefined();
    expect(cfg!.columns.find(c => c.key === 'actions')).toBeUndefined();
    expect(cfg!.getRowKey({
      cnsiGuid: 'cnsi-1', guid: 'user-1', username: 'alice',
      orgRoles: [], spaceRoles: [],
    } as any)).toBe('cnsi-1:user-1');
  });

  it('Space Roles column narrows to roles in THIS space only', () => {
    const cfg = component.listConfig();
    const col = cfg!.columns.find(c => c.key === 'spaceRoles');
    expect(col).toBeDefined();
    // User holds a role in our space AND in another space — render only ours.
    const inThisSpace: any = {
      cnsiGuid: 'cnsi-1', guid: 'user-1', username: 'alice',
      orgRoles: [],
      spaceRoles: [
        { orgGuid: 'org-1', spaceGuid: 'space-1', roles: ['developer', 'manager'] },
        { orgGuid: 'org-2', spaceGuid: 'space-other', roles: ['auditor'] },
      ],
    };
    expect(col!.render!(inThisSpace)).toBe('developer, manager');
    // User has no role in our space at all — em-dash placeholder.
    const notInThisSpace: any = {
      cnsiGuid: 'cnsi-1', guid: 'user-2', username: 'bob',
      orgRoles: [],
      spaceRoles: [{ orgGuid: 'org-2', spaceGuid: 'space-other', roles: ['auditor'] }],
    };
    expect(col!.render!(notInThisSpace)).toBe('—');
  });
});

// ─── subNavActions ───────────────────────────────────────────────────────────

async function makeSubNavFixture(canReturn: boolean, filteredItems?: StUser[]): Promise<{
  component: CloudFoundrySpaceUsersComponent;
  fixture: ComponentFixture<CloudFoundrySpaceUsersComponent>;
  stubSignalConfig: ReturnType<typeof makeStubSignalConfigService>;
}> {
  const stubSignalConfig = makeStubSignalConfigService({ filteredItems: filteredItems ?? [] });
  await TestBed.configureTestingModule({
    imports: [CloudFoundrySpaceUsersComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      provideHttpClient(),
      ...STORE_TEST_PROVIDERS,
      importProvidersFrom(generateCfBaseTestModulesNoShared()),
      TabNavService,
      { provide: CfUsersSignalConfigService, useValue: stubSignalConfig },
      { provide: CloudFoundryEndpointService, useValue: { cfGuid: 'cnsi-1' } },
      { provide: CloudFoundryOrganizationService, useValue: { orgGuid: 'org-1', cfGuid: 'cnsi-1' } },
      { provide: CloudFoundrySpaceService, useValue: { spaceGuid: 'space-1', orgGuid: 'org-1', cfGuid: 'cnsi-1' } },
      { provide: CurrentUserPermissionsService, useValue: { can: () => of(canReturn) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(CloudFoundrySpaceUsersComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { component, fixture, stubSignalConfig };
}

describe('CloudFoundrySpaceUsersComponent — subNavActions', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('exposes two subNavActions with correct dataTest and variant', async () => {
    const { component } = await makeSubNavFixture(true);
    const actions = (component as any).subNavActions as readonly { dataTest?: string; variant?: string }[];
    expect(actions).toHaveLength(2);
    const manageRoles = actions.find(a => a.dataTest === 'cf-space-users-bulk-manage-roles');
    const removeSpace = actions.find(a => a.dataTest === 'cf-space-users-bulk-remove-space');
    expect(manageRoles).toBeDefined();
    expect(removeSpace).toBeDefined();
    expect(manageRoles!.variant).toBe('primary');
    expect(removeSpace!.variant).toBe('destructive');
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

// ─── manage-roles gating ─────────────────────────────────────────────────────

function subNavManageAction(component: CloudFoundrySpaceUsersComponent) {
  const actions = (component as any).subNavActions as readonly { dataTest?: string; disabled?: () => boolean }[];
  return actions.find(a => a.dataTest === 'cf-space-users-bulk-manage-roles')!;
}

describe('CloudFoundrySpaceUsersComponent — manage-roles gating', () => {
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

// ─── bulk remove (space-scoped) ──────────────────────────────────────────────

const userWithSpaceRole: StUser = {
  guid: 'u1', cnsiGuid: 'cnsi-1', username: 'alice',
  orgRoles: [],
  spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'space-1', roles: ['developer'] }],
} as any;

const userWithRoleInOtherSpace: StUser = {
  guid: 'u2', cnsiGuid: 'cnsi-1', username: 'bob',
  orgRoles: [],
  spaceRoles: [{ orgGuid: 'org-1', spaceGuid: 'space-other', roles: ['developer'] }],
} as any;

const userWithNoSpaceRole: StUser = {
  guid: 'u3', cnsiGuid: 'cnsi-1', username: 'charlie',
  orgRoles: [],
  spaceRoles: [],
} as any;

describe('CloudFoundrySpaceUsersComponent — bulk remove', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function subNavAction(component: CloudFoundrySpaceUsersComponent, dt: string) {
    const actions = (component as any).subNavActions as readonly { dataTest?: string; disabled?: () => boolean }[];
    return actions.find(a => a.dataTest === dt)!;
  }

  it('exposes Remove from Space in subNavActions', async () => {
    const { component } = await makeSubNavFixture(true);
    expect(subNavAction(component, 'cf-space-users-bulk-remove-space')).toBeTruthy();
  });

  it('disables Remove from Space when selection is empty', async () => {
    const { component } = await makeSubNavFixture(true);
    (component as any)._selectedUserKeys.set(new Set());
    expect(subNavAction(component, 'cf-space-users-bulk-remove-space').disabled!()).toBe(true);
  });

  it('disables Remove from Space when canManageRoles is false', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(false, [userWithSpaceRole]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithSpaceRole]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u1']));
    expect(subNavAction(component, 'cf-space-users-bulk-remove-space').disabled!()).toBe(true);
  });

  it('disables Remove from Space when selected user has no role in THIS space', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(true, [userWithRoleInOtherSpace]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithRoleInOtherSpace]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u2']));
    expect(subNavAction(component, 'cf-space-users-bulk-remove-space').disabled!()).toBe(true);
  });

  it('disables Remove from Space when selected user has no space roles at all', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(true, [userWithNoSpaceRole]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithNoSpaceRole]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u3']));
    expect(subNavAction(component, 'cf-space-users-bulk-remove-space').disabled!()).toBe(true);
  });

  it('enables Remove from Space when selected user has a role in THIS space', async () => {
    const { component, stubSignalConfig } = await makeSubNavFixture(true, [userWithSpaceRole]);
    stubSignalConfig.view._filteredItemsWritable.set([userWithSpaceRole]);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:u1']));
    expect(subNavAction(component, 'cf-space-users-bulk-remove-space').disabled!()).toBe(false);
  });

  it('drops the per-row kebab (no actions column)', async () => {
    const { component } = await makeSubNavFixture(true);
    expect(component.listConfig()!.columns.find(c => c.key === 'actions')).toBeUndefined();
  });
});
