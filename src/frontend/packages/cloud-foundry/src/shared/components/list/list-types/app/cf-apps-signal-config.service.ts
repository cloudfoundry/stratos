import { Injectable, Signal, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import type { EndpointModel } from '@stratosui/store';
import { CnsiAppsSource } from '../../../../../services/data-sources/cnsi-apps-source';
import { MergeOrchestrator } from '../../../../../services/data-sources/merge-orchestrator';
import { ViewPipeline, SortSpec } from '../../../../../services/data-sources/view-pipeline';
import type { StApp } from '../../../../../services/endpoint-data/stratos-types';
import { CloudFoundryService } from '../../../../data-services/cloud-foundry.service';
import type { SignalListDropdownOption } from '@stratosui/core';

@Injectable({ providedIn: 'root' })
export class CfAppsSignalConfigService {
  orchestrator!: MergeOrchestrator<StApp>;
  view!: ViewPipeline<StApp>;

  // User-controlled filter / sort / pagination state.
  readonly filter: WritableSignal<(app: StApp) => boolean> = signal(() => true);
  readonly sort: WritableSignal<SortSpec<StApp>> = signal({ field: 'name' as keyof StApp, direction: 'asc' });
  readonly pageSize: WritableSignal<number> = signal(20);
  readonly pageIndex: WritableSignal<number> = signal(0);

  // Toolbar filter inputs. `null` for dropdowns = "All" (no constraint);
  // empty string for nameFilter = no name constraint.
  readonly selectedCnsi:  WritableSignal<string | null> = signal(null);
  readonly selectedOrg:   WritableSignal<string | null> = signal(null);
  readonly selectedSpace: WritableSignal<string | null> = signal(null);
  readonly nameFilter:    WritableSignal<string>        = signal('');

  // Bridge connected-CF endpoints (an rxjs Observable) into a signal so
  // computed() can read it. CloudFoundryService is optional purely because
  // tests exist that don't provide it; in the real app it's always present.
  private readonly connectedEndpoints: Signal<EndpointModel[]>;

  // Computed option lists for the toolbar dropdowns.
  readonly cnsiOptions:  Signal<SignalListDropdownOption[]>;
  readonly orgOptions:   Signal<SignalListDropdownOption[]>;
  readonly spaceOptions: Signal<SignalListDropdownOption[]>;

  constructor(private readonly http: HttpClient) {
    const cfService = inject(CloudFoundryService, { optional: true });
    this.connectedEndpoints = cfService
      ? toSignal(cfService.connectedCFEndpoints$, { initialValue: [] as EndpointModel[] })
      : signal<EndpointModel[]>([]).asReadonly();

    // CF options come from the connected endpoints list directly.
    this.cnsiOptions = computed(() => {
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      for (const ep of this.connectedEndpoints() ?? []) {
        opts.push({ label: ep.name ?? ep.guid, value: ep.guid });
      }
      return opts;
    });

    // Org options come from the currently loaded app list. This is an
    // acceptable approximation — it surfaces orgs that *have* apps in the
    // current view, but misses empty orgs. See plan for trade-off.
    this.orgOptions = computed(() => {
      const cnsi = this.selectedCnsi();
      const seen = new Map<string, string>();
      const items = this.orchestrator?.allItems() ?? [];
      for (const app of items) {
        if (cnsi && app.cnsiGuid !== cnsi) continue;
        if (!app.orgGuid) continue;
        if (!seen.has(app.orgGuid)) seen.set(app.orgGuid, app.orgGuid);
      }
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      for (const [guid, label] of seen) opts.push({ label, value: guid });
      return opts;
    });

    // Space options are scoped to the currently selected org (and CF).
    this.spaceOptions = computed(() => {
      const cnsi = this.selectedCnsi();
      const org = this.selectedOrg();
      const seen = new Map<string, string>();
      const items = this.orchestrator?.allItems() ?? [];
      for (const app of items) {
        if (cnsi && app.cnsiGuid !== cnsi) continue;
        if (org && app.orgGuid !== org) continue;
        if (!app.spaceGuid) continue;
        if (!seen.has(app.spaceGuid)) seen.set(app.spaceGuid, app.spaceGuid);
      }
      const opts: SignalListDropdownOption[] = [{ label: 'All', value: null }];
      for (const [guid, label] of seen) opts.push({ label, value: guid });
      return opts;
    });

    // Re-derive the filter predicate whenever any of the four toolbar
    // signals change. Writing a brand new function to `this.filter`
    // triggers ViewPipeline.filteredItems to recompute. effect() needs an
    // injection context; @Injectable({providedIn:'root'}) supplies one at
    // construction time.
    effect(() => {
      const cnsi = this.selectedCnsi();
      const org = this.selectedOrg();
      const space = this.selectedSpace();
      const q = this.nameFilter().trim().toLowerCase();
      this.filter.set((app: StApp) => {
        if (cnsi && app.cnsiGuid !== cnsi) return false;
        if (org && app.orgGuid !== org) return false;
        if (space && app.spaceGuid !== space) return false;
        if (q && !(app.name || '').toLowerCase().includes(q)) return false;
        return true;
      });
    });
  }

  initialize(cnsiGuids: readonly string[]): void {
    const sources = cnsiGuids.map(guid => new CnsiAppsSource(guid, this.http));
    this.orchestrator = new MergeOrchestrator<StApp>(sources);
    this.view = new ViewPipeline<StApp>(
      this.orchestrator.allItems,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
    );
  }

  async loadAll(): Promise<void> {
    await this.orchestrator.load();
  }

  async refresh(): Promise<void> {
    await this.orchestrator.refresh();
  }

  async deleteApp(cnsiGuid: string, appGuid: string): Promise<void> {
    const src = this.orchestrator.sourceFor(cnsiGuid) as CnsiAppsSource | undefined;
    if (!src) throw new Error(`no source for cnsi ${cnsiGuid}`);
    await src.delete(appGuid);
  }
}
