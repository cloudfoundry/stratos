import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmationDialogService, CurrentUserPermissionsService, TailwindSnackBarService } from '@stratosui/core';
import { UserFavoriteManager } from '@stratosui/store';
import { CF_FAILURE_DETAIL, cfRequestFailure, snackText } from '@test-framework/cf';

import { CfSpacesSignalConfigService } from '../../../../../shared/signal-list-configs/space/cf-spaces-signal-config.service';
import type { StSpace } from '../../../../../services/endpoint-data/stratos-types';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CloudFoundryOrganizationSpacesSignalComponent } from './cloud-foundry-organization-spaces-signal.component';

// The list's config service: only what the component reads to build its list.
function makeSpacesConfig() {
  return {
    initialize: vi.fn(),
    view: {
      pagedItems: signal([] as StSpace[]).asReadonly(),
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
    deleteSpace: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CloudFoundryOrganizationSpacesSignalComponent', () => {
  let component: CloudFoundryOrganizationSpacesSignalComponent;
  let spacesConfig: ReturnType<typeof makeSpacesConfig>;
  let snackError: ReturnType<typeof vi.fn>;

  const space = { cnsiGuid: 'cnsi-1', guid: 'space-1', name: 'dev' } as StSpace;

  beforeEach(() => {
    spacesConfig = makeSpacesConfig();
    snackError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: CloudFoundryEndpointService, useValue: { cfGuid: 'cnsi-1' } },
        { provide: CloudFoundryOrganizationService, useValue: { orgGuid: 'org-1' } },
        { provide: CfSpacesSignalConfigService, useValue: spacesConfig },
        { provide: UserFavoriteManager, useValue: { getAllFavorites: () => of([{}, {}]), toggleFavorite: vi.fn() } },
        { provide: CurrentUserPermissionsService, useValue: { can: () => of(true) } },
        // The confirm dialog waits for the user; here it confirms at once.
        { provide: ConfirmationDialogService, useValue: { open: (_cfg: unknown, doFn: () => void) => doFn() } },
        { provide: TailwindSnackBarService, useValue: { error: snackError } },
      ],
    });
    // The class alone: these tests are about its row actions, not its template.
    component = TestBed.runInInjectionContext(() => new CloudFoundryOrganizationSpacesSignalComponent());
  });

  const rowAction = (label: string) =>
    component.listConfig()!.columns.find(c => c.kind === 'actions')!.actions!(space).find(a => a.label === label)!;

  it('deletes the space once the delete is confirmed', async () => {
    rowAction('Delete').invoke(space);
    await vi.waitFor(() => expect(spacesConfig.deleteSpace).toHaveBeenCalledWith('cnsi-1', 'space-1', 'dev'));
    expect(snackError).not.toHaveBeenCalled();
  });

  it('says why a delete failed in Cloud Foundry\'s words', async () => {
    spacesConfig.deleteSpace.mockRejectedValueOnce(cfRequestFailure());
    rowAction('Delete').invoke(space);
    await vi.waitFor(() => expect(snackError).toHaveBeenCalled());
    expect(snackText(snackError.mock.calls[0][0])).toBe(`Delete failed: ${CF_FAILURE_DETAIL}`);
  });
});
