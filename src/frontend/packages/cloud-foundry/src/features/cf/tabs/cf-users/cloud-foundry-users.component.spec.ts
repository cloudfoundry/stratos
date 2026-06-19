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
}) {
  const pageIndex = signal(0);
  const pageSize = signal(25);
  const filterSig = signal(() => true);
  const sortSig = signal({ field: 'username' as const, direction: 'asc' as const });
  const view = {
    pagedItems: signal<StUser[]>([]).asReadonly(),
    totalItems: signal(0).asReadonly(),
    totalFilteredResults: signal(0).asReadonly(),
    totalPages: signal(1).asReadonly(),
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
      '', 'Username', 'Origin', 'Org Roles', 'Space Roles', 'Created', '',
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

// ─── manage-roles gating ────────────────────────────────────────────────────

function bulkManageAction(component: CloudFoundryUsersComponent) {
  const cfg = component.listConfig();
  return cfg!.bulkActions!.find(a => a.dataTest === 'cf-users-bulk-manage-roles')!;
}

async function makeGatingFixture(canReturn: boolean): Promise<{
  component: CloudFoundryUsersComponent;
  fixture: ComponentFixture<CloudFoundryUsersComponent>;
}> {
  const stubSignalConfig = makeStubSignalConfigService({
    orgNames: new Map(),
    spaceNames: new Map(),
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
  return { component, fixture };
}

describe('CloudFoundryUsersComponent — manage-roles gating', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('disables Manage Roles when nothing is selected (even with permission)', async () => {
    const { component } = await makeGatingFixture(true);
    (component as any)._selectedUserKeys.set(new Set());
    expect(bulkManageAction(component).disabled!()).toBe(true);
  });

  it('enables Manage Roles when users are selected and the user may change roles', async () => {
    const { component } = await makeGatingFixture(true);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:user-1']));
    expect(bulkManageAction(component).disabled!()).toBe(false);
  });

  it('disables Manage Roles when the user may NOT change roles, regardless of selection', async () => {
    const { component } = await makeGatingFixture(false);
    (component as any)._selectedUserKeys.set(new Set(['cnsi-1:user-1']));
    expect(bulkManageAction(component).disabled!()).toBe(true);
  });
});
