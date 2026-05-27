import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundrySpaceUsersComponent } from './cloud-foundry-space-users.component';
import {
  CfUsersSignalConfigService,
} from '../../../../../../../shared/components/list/list-types/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import type { StUser } from '../../../../../../../services/endpoint-data/stratos-types';

function makeStubSignalConfigService() {
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

  it('builds a SignalListConfig with the per-space columns (no Org Roles)', () => {
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.columns.map(c => c.header)).toEqual([
      'Username', 'Origin', 'Space Roles', 'Created', '',
    ]);
    expect(cfg!.columns.find(c => c.key === 'orgRoles')).toBeUndefined();
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

  // Note: a previous test asserted on `cfg.headerActions` for "Manage
  // Roles" + "Invite User" placeholders. SignalListConfig.headerActions
  // was removed (see commit "Sweep remaining headerActions consumers");
  // a framework slot for non-add page-level actions is tracked
  // separately. The test is dropped along with the field.
});
