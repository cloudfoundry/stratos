import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { CloudFoundryOrganizationUsersComponent } from './cloud-foundry-organization-users.component';
import {
  CfUsersSignalConfigService,
} from '../../../../../shared/signal-list-configs/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import type { StUser } from '../../../../../services/endpoint-data/stratos-types';

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
        { provide: CloudFoundryOrganizationService, useValue: { orgGuid: 'org-1', cfGuid: 'cnsi-1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudFoundryOrganizationUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes the signal config for this org (pinned scope)', () => {
    expect(stubSignalConfig.initializeForOrg).toHaveBeenCalledWith('cnsi-1', 'org-1');
  });

  it('builds a SignalListConfig with the per-org columns', () => {
    const cfg = component.listConfig();
    expect(cfg).toBeDefined();
    expect(cfg!.columns.map(c => c.header)).toEqual([
      'Username', 'Origin', 'Org Roles', 'Space Roles', 'Created', '',
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
