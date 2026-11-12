import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmationDialogService, CurrentUserPermissionsService, TailwindSnackBarService } from '@stratosui/core';
import { UserFavoriteManager } from '@stratosui/store';
import { CF_FAILURE_DETAIL, cfRequestFailure, snackText } from '@test-framework/cf';

import { CfOrgsSignalConfigService } from '../../../../shared/signal-list-configs/org/cf-orgs-signal-config.service';
import type { StOrg } from '../../../../services/endpoint-data/stratos-types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationsSignalComponent } from './cloud-foundry-organizations-signal.component';

// The list's config service: only what the component reads to build its list.
function makeOrgsConfig() {
  return {
    initialize: vi.fn(),
    view: {
      pagedItems: signal([] as StOrg[]).asReadonly(),
      totalItems: signal(0).asReadonly(),
      totalFilteredResults: signal(0).asReadonly(),
      totalPages: signal(1).asReadonly(),
    },
    pageIndex: signal(0),
    pageSize: signal(25),
    hasLoadedOnce: signal(true).asReadonly(),
    errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
    nameFilter: signal(''),
    viewMode: signal<'table' | 'card'>('table'),
    sort: signal({ field: 'name', direction: 'asc' }),
    refresh: vi.fn().mockResolvedValue(undefined),
    clearFilters: vi.fn(),
    registerSortExtractor: vi.fn(),
    deleteOrg: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CloudFoundryOrganizationsSignalComponent', () => {
  let component: CloudFoundryOrganizationsSignalComponent;
  let orgsConfig: ReturnType<typeof makeOrgsConfig>;
  let snackError: ReturnType<typeof vi.fn>;

  const org = { cnsiGuid: 'cnsi-1', guid: 'org-1', name: 'acme' } as StOrg;

  beforeEach(() => {
    orgsConfig = makeOrgsConfig();
    snackError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: CloudFoundryEndpointService, useValue: { cfGuid: 'cnsi-1' } },
        { provide: CfOrgsSignalConfigService, useValue: orgsConfig },
        { provide: UserFavoriteManager, useValue: { entityFavoriteKeys: () => new Set<string>(), toggleFavorite: vi.fn() } },
        { provide: CurrentUserPermissionsService, useValue: { can: () => of(true) } },
        // The confirm dialog waits for the user; here it confirms at once.
        { provide: ConfirmationDialogService, useValue: { open: (_cfg: unknown, doFn: () => void) => doFn() } },
        { provide: TailwindSnackBarService, useValue: { error: snackError } },
      ],
    });
    // The class alone: these tests are about its row actions, not its template.
    component = TestBed.runInInjectionContext(() => new CloudFoundryOrganizationsSignalComponent());
  });

  const rowAction = (label: string) =>
    component.listConfig()!.columns.find(c => c.kind === 'actions')!.actions!(org).find(a => a.label === label)!;

  it('deletes the organization once the delete is confirmed', async () => {
    rowAction('Delete').invoke(org);
    await vi.waitFor(() => expect(orgsConfig.deleteOrg).toHaveBeenCalledWith('cnsi-1', 'org-1', 'acme'));
    expect(snackError).not.toHaveBeenCalled();
  });

  it('says why a delete failed in Cloud Foundry\'s words', async () => {
    orgsConfig.deleteOrg.mockRejectedValueOnce(cfRequestFailure());
    rowAction('Delete').invoke(org);
    await vi.waitFor(() => expect(snackError).toHaveBeenCalled());
    expect(snackText(snackError.mock.calls[0][0])).toBe(`Delete failed: ${CF_FAILURE_DETAIL}`);
  });
});
