import { EffectRef, Injectable, Injector, Signal, WritableSignal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ListStateStore } from '@stratosui/core';

import { ViewPipeline, SortSpec } from '../../../services/data-sources/view-pipeline';
import { EntityDeleteController } from '../../../services/deletes/entity-delete.controller';
import type { DeleteOutcome } from '../../../services/deletes/delete-event.types';
import { runCfDelete } from '../../../services/deletes/run-cf-delete';
import { spaceEntityType } from '../../../cf-entity-types';
import { OrgDataRegistry } from '../../../services/endpoint-data/org-data.registry';
import type { OrgDataService } from '../../../services/endpoint-data/org-data.service';
import type { StSpace } from '../../../services/endpoint-data/stratos-types';

// Spaces list config service — single-CNSI, single-org. Reads the org's
// OrgDataService (the org page's own load of the org-scoped Jetstream
// endpoint `/pp/v1/cf/org/{cnsi}/{org}/spaces`, every page) instead of
// draining the same enriched list a second time, and instead of the
// per-CNSI `endpointDataService.spaces()` cache.
//
// The per-CNSI cache is populated by `loadDetails()` with a single
// `?per_page=500&page=1` request — fine for small foundations, but on
// adepttech (~2500 spaces across 6 pages) any space on page 2..N is
// silently dropped, making this list show "0 of 0" for orgs whose
// spaces happen to fall later in alphabetical order. The per-org
// endpoint sidesteps the issue: the filter `organization_guids={org}`
// runs on CAPI, so we only retrieve the spaces that actually belong to
// this org. For most orgs that's a single page of <50 rows; the page-2+
// drain handles the unusual case where a single org has 200+ spaces.
@Injectable({ providedIn: 'root' })
export class CfSpacesSignalConfigService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly deleteController = inject(EntityDeleteController);

  private readonly orgRegistry = inject(OrgDataRegistry);
  /** The org in scope; swapped by initialize() on navigation between orgs. */
  private readonly orgData = signal<OrgDataService | null>(null);

  private readonly state = inject(ListStateStore).bind('cf-spaces', {
    viewMode: 'card',
    pageSize: [24, 25],
    pageIndex: [0, 0],
    sort: [{ field: 'name', direction: 'asc' }, { field: 'name', direction: 'asc' }],
  });

  readonly filter: WritableSignal<(space: StSpace) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StSpace>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly nameFilter: WritableSignal<string> = signal('');
  readonly viewMode = this.state.viewMode;

  /** All spaces for the active org; the ViewPipeline reads this signal as its source. */
  readonly spaces: Signal<StSpace[]> = computed(() => this.orgData()?.spaces() ?? []);

  view!: ViewPipeline<StSpace>;

  // Captured so a re-entry (root singleton, but initialize() runs per mount)
  // destroys the prior filter effect instead of stacking one per navigation.
  private filterEffect?: EffectRef;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StSpace) => unknown>> = signal(new Map());

  readonly hasLoadedOnce: Signal<boolean> = computed(() => this.orgData()?.spacesSettled() ?? false);

  // Last spaces failure keyed by cnsi, for the signal-list error surfaces
  // (top strip + failed-load empty state with Retry). Cleared on the next
  // successful drain.
  readonly errorsByCnsi: Signal<Map<string, unknown>> = computed(() => {
    const org = this.orgData();
    const failed = org?.errors().find(e => e.resource === 'spaces');
    return org && failed ? new Map([[org.cnsiGuid, failed.detail ?? failed]]) : new Map();
  });

  initialize(cnsiGuid: string, orgGuid: string): void {
    // New scope → new data set: drop any page position the previous
    // scope left behind (#5670). Same scope re-entry keeps position.
    this.state.resetPageOnScopeChange(`${cnsiGuid}:${orgGuid}`);
    // One OrgDataService per org (sticky registry), so switching orgs never
    // shows the previous org's rows; load() is a no-op once warm.
    const orgData = this.orgRegistry.acquire(cnsiGuid, orgGuid);
    this.orgData.set(orgData);
    orgData.load().subscribe({ error: () => {} });
    this.view = new ViewPipeline<StSpace>(
      this.spaces,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );
    this.filterEffect?.destroy();
    runInInjectionContext(this.injector, () => {
      this.filterEffect = effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((s: StSpace) => {
          if (!q) return true;
          return (s.name ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.sort.set({ field: 'name', direction: 'asc' });
    this.pageIndex.set(0);
  }

  async refresh(): Promise<void> {
    const orgData = this.orgData();
    if (orgData) {
      await firstValueFrom(orgData.refreshSpaces(), { defaultValue: undefined });
    }
  }

  registerSortExtractor(fieldKey: string, extractor: (row: StSpace) => unknown): void {
    this._sortExtractors.update(curr => {
      const next = new Map(curr);
      next.set(fieldKey, extractor);
      return next;
    });
  }

  // Delete a space through the EntityDeleteController chokepoint. The
  // controller derives the full invalidation set from the relation graph
  // (descendant apps/routes/serviceInstances/bindings + the org's space-count
  // via reverse edge), removes the space row, and fires cleanup hooks.
  async deleteSpace(cnsiGuid: string, spaceGuid: string, spaceName: string = spaceGuid): Promise<DeleteOutcome> {
    const outcome = await runCfDelete(this.deleteController, this.http, {
      cnsiGuid,
      entityKind: spaceEntityType,
      deleteGuid: spaceGuid,
      deleteName: spaceName,
      path: `/pp/v1/cf/spaces/${cnsiGuid}/${spaceGuid}`,
    });
    if (outcome === 'deleted') {
      // Evict the row from the org's list so an in-tab delete disappears
      // without a refetch (the delete cleanup hook does the same; both are
      // idempotent).
      this.orgData()?.applySpaceDeleted(spaceGuid);
    } else {
      // Unknown result: re-read the org's spaces to show whether it is gone.
      await this.refresh();
    }
    return outcome;
  }
}
