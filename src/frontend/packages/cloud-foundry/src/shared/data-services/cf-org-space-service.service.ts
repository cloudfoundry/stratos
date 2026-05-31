import { Injectable, OnDestroy, Signal, WritableSignal, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { naturalCompare } from '@stratosui/core';
import {
  EndpointModel,
  EndpointsDataService,
  PaginatedAction,
  PaginationEntityState,
  PaginationMonitorFactory,
  Store,
} from '@stratosui/store';
import { CFAppState } from '../../cf-app-state';
import { cfEntityFactory } from '../../cf-entity-factory';
import { IOrganization, ISpace } from '../../cf-api.types';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { EndpointDataRegistry } from '../../services/endpoint-data/endpoint-data.registry';
import type { EndpointDataService } from '../../services/endpoint-data/endpoint-data.service';
import { CfOrgSpaceDebug, createCfOrgSpaceDebug } from './cf-org-space-debug';

export function createCfOrgSpaceFilterConfig(key: string, label: string, cfOrgSpaceItem: CfOrgSpaceItem) {
  // Bridge layer for the legacy IListMultiFilterConfig interface in the
  // core list framework, which still requires `list$: Observable<...>`
  // and `loading$: Observable<boolean>`. See
  // project_ilistmultifilterconfig_signal_debt — retires when that
  // interface migrates to Signal.
  return {
    key,
    label,
    select: cfOrgSpaceItem.select,
    loading$: cfOrgSpaceItem.loading$,
    list$: cfOrgSpaceItem.list$.pipe(map((entities: any[]) => {
      return entities.map(entity => ({
        label: entity.name,
        item: entity,
        value: entity.guid
      }));
    })),
  };
}

/**
 * Signal-native cf/org/space picker state. `list` / `loading` / `select`
 * are signals; consumers read via signal-call and write via `.set()`.
 *
 * `list$` and `loading$` are deprecated bridge views retained only for
 * `createCfOrgSpaceFilterConfig` → `IListMultiFilterConfig` in the core
 * list framework. They retire when the list framework multi-filter API
 * migrates to Signal. See `project_ilistmultifilterconfig_signal_debt`.
 */
export interface CfOrgSpaceItem<T = any> {
  list: Signal<T[]>;
  loading: Signal<boolean>;
  /**
   * Source-of-truth WritableSignal augmented with `next`/`asObservable`
   * compat for the framework `IListMultiFilterConfig.select` slot.
   * Consumers should use `select.set(v)` and `select()`; the augmentation
   * methods are only there so the framework keeps working.
   */
  select: WritableSignal<string | null> & {
    next: (v: string | null) => void;
    asObservable: () => Observable<string | null>;
  };
  /** @deprecated Bridge for `IListMultiFilterConfig.list$`. */
  readonly list$: Observable<T[]>;
  /** @deprecated Bridge for `IListMultiFilterConfig.loading$`. */
  readonly loading$: Observable<boolean>;
}

interface InitialValues { cf: string; org: string; space: string; }

/**
 * Signal-native cf/org/space picker store.
 *
 * State of the world:
 * - Selection (`_cfSelected`, `_orgSelected`, `_spaceSelected`) are
 *   WritableSignals — single source of truth.
 * - Org and space lists are sourced from the per-CNSI
 *   `EndpointDataService` (acquired through `EndpointDataRegistry`),
 *   not fetched directly. The registry already drains orgs+spaces on
 *   home / wall navigation, so the picker reuses the warmed cache.
 * - Cascade (cf change clears org+space, org change clears space) and
 *   singleton auto-pick are `effect()` reactions to the selection
 *   signals. No rxjs operators in the control flow.
 * - The legacy `cf/org/space.{list$, loading$, select}` shape is kept as
 *   a thin shim — `list$`/`loading$` are `toObservable(signal)` and
 *   `select` is a BehaviorSubject backed by the underlying signal so
 *   `select.next(v)` writes the signal and signal updates emit on the
 *   BehaviorSubject. Existing rxjs consumers keep working until they
 *   migrate; the shim is the only intentional rxjs surface.
 * - The connected-CF-endpoint list still comes from the ngrx endpoint
 *   store via a one-line `toSignal(store.select(...))` bridge — there's
 *   no signal-based replacement for that store yet.
 * - The setInitialValuesFromAction path remains rxjs because it reads
 *   from a caller-supplied ngrx PaginatedAction's persisted client-filter
 *   state. That bridge retires when services-wall (its only caller)
 *   migrates to signal-native.
 *
 * This service relies on OnDestroy, so must be `provided` by a component.
 */
@Injectable({
  providedIn: 'root'
})
export class CfOrgSpaceDataService implements OnDestroy {
  private store = inject<Store<CFAppState>>(Store);
  private endpointsService = inject(EndpointsDataService);
  private endpointRegistry = inject(EndpointDataRegistry);
  paginationMonitorFactory = inject(PaginationMonitorFactory);

  // Per-CNSI acquired EndpointDataService handles. Each handle is
  // released on destroy. The registry refcounts so multiple acquirers
  // (this picker + a wall page + the home cards) share one drain.
  private _edsByCnsi = signal<Map<string, EndpointDataService>>(new Map());

  private debug: CfOrgSpaceDebug = createCfOrgSpaceDebug();

  // === Selection state (source of truth) ===
  private _cfSelected = signal<string | null>(null);
  private _orgSelected = signal<string | null>(null);
  private _spaceSelected = signal<string | null>(null);

  // === Data state ===
  // org and space lists are now sourced from EndpointDataService via the
  // `_edsByCnsi` handle map (declared earlier). _orgFetching /
  // _spaceFetching mirror EDS.isLoadingOrgs / isLoadingSpaces for the
  // currently selected CF / org pair so consumers keep their existing
  // org.loading / space.loading API surface.
  private _orgFetching = signal(false);
  private _spaceFetching = signal(false);

  private _autoSelectEnabled = signal(false);

  // === Connected CF endpoints ===
  // Wave 2 (W36-B): sourced from `EndpointsDataService` signals rather
  // than `connectedEndpointsOfTypesSelector`. Sorting is done in a
  // `computed` over the service Map; the legacy rxjs `filter`+`map`
  // pipeline is no longer needed.
  private connectedCfList: Signal<EndpointModel[]> = computed(() =>
    Array.from(this.endpointsService.endpoints().values())
      .filter(e => e.cnsi_type === CF_ENDPOINT_TYPE && e.connectionStatus === 'connected')
      .sort((a, b) => naturalCompare(a.name, b.name))
  );

  // === Public derived signals ===
  /** Orgs for the currently-selected cnsi. Reads from EndpointDataService
   *  via the per-CNSI handle (already drained by the registry). Empty
   *  until the drain lands. Sorted by name (natural compare) so org_2
   *  lands between org_1 and org_3, not after org_19 — CAPI returns
   *  creation order by default which isn't useful for scanning. */
  public orgList: Signal<{ guid: string; name: string }[]> = computed(() => {
    const cnsi = this._cfSelected();
    if (!cnsi) return [];
    const eds = this._edsByCnsi().get(cnsi);
    const list = eds ? eds.orgs() : [];
    return [...list].sort((a, b) => naturalCompare(a.name, b.name));
  });

  /** Spaces for the currently-selected (cnsi, org). Reads from EDS too —
   *  filters EDS.spaces() by orgGuid. Sorted by name for the same reason
   *  as orgList. */
  public spaceList: Signal<{ guid: string; name: string }[]> = computed(() => {
    const cnsi = this._cfSelected();
    const org = this._orgSelected();
    if (!cnsi || !org) return [];
    const eds = this._edsByCnsi().get(cnsi);
    if (!eds) return [];
    const list = eds.spaces().filter(s => s.orgGuid === org);
    return [...list].sort((a, b) => naturalCompare(a.name, b.name));
  });

  // === Public signal-native CfOrgSpaceItem API ===
  public cf!: CfOrgSpaceItem<EndpointModel>;
  public org!: CfOrgSpaceItem<IOrganization>;
  public space!: CfOrgSpaceItem<ISpace>;
  public isLoading!: Signal<boolean>;

  // setInitialValuesFromAction support (services-wall persisted filter)
  public initialValues$!: Observable<any>;
  public initialValuesMap!: (param: any) => InitialValues;

  constructor() {
    this.debug.log('service:construct');

    // Build the signal-native picker triples. `list` / `loading` are
    // signals; `select` is a WritableSignal augmented with `.next` /
    // `.asObservable` so the legacy `IListMultiFilterConfig.select`
    // contract keeps working. The Observable bridge views `list$` /
    // `loading$` are kept narrowly for the framework's filter config
    // (see `project_ilistmultifilterconfig_signal_debt`).
    const cfLoading = computed(() => this.connectedCfList().length === 0);
    this.cf = {
      list: this.connectedCfList,
      loading: cfLoading,
      select: this.augmentSelect(this._cfSelected, 'cf'),
      list$: toObservable(this.connectedCfList) as Observable<EndpointModel[]>,
      loading$: toObservable(cfLoading),
    };
    this.org = {
      list: this.orgList as Signal<IOrganization[]>,
      loading: this._orgFetching.asReadonly(),
      select: this.augmentSelect(this._orgSelected, 'org'),
      list$: toObservable(this.orgList) as Observable<IOrganization[]>,
      loading$: toObservable(this._orgFetching),
    };
    this.space = {
      list: this.spaceList as Signal<ISpace[]>,
      loading: this._spaceFetching.asReadonly(),
      select: this.augmentSelect(this._spaceSelected, 'space'),
      list$: toObservable(this.spaceList) as Observable<ISpace[]>,
      loading$: toObservable(this._spaceFetching),
    };
    this.isLoading = computed(() =>
      this.connectedCfList().length === 0 || this._orgFetching() || this._spaceFetching()
    );

    // === Effects ===

    // Acquire an EndpointDataService for the selected CNSI. The registry
    // refcounts and drives the orgs+spaces drain via its own card/details
    // queue. Reading EDS.orgs() / EDS.spaces() is reactive — the picker's
    // orgList / spaceList computeds (below) re-evaluate as soon as the
    // drain lands. Eliminates the previous duplicate `/pp/v1/cf/orgs/...`
    // and `/pp/v1/cf/org/.../spaces` fetches that were redundant with the
    // home-card / wall hydration the registry already drives.
    effect(() => {
      const cnsi = this._cfSelected();
      if (!cnsi) return;
      const cur = untracked(() => this._edsByCnsi());
      if (cur.has(cnsi)) return;
      const eds = this.endpointRegistry.acquire(cnsi);
      untracked(() => this._edsByCnsi.update(m => {
        const n = new Map(m);
        n.set(cnsi, eds);
        return n;
      }));
    });

    // Mirror EDS loading flags into the picker's loading signals so
    // consumers don't have to know about the EDS handle layer.
    effect(() => {
      const cnsi = this._cfSelected();
      if (!cnsi) { untracked(() => this._orgFetching.set(false)); return; }
      const eds = this._edsByCnsi().get(cnsi);
      const loading = eds ? eds.isLoadingOrgs() : false;
      untracked(() => this._orgFetching.set(loading));
    });
    effect(() => {
      const cnsi = this._cfSelected();
      const orgGuid = this._orgSelected();
      if (!cnsi || !orgGuid) { untracked(() => this._spaceFetching.set(false)); return; }
      const eds = this._edsByCnsi().get(cnsi);
      const loading = eds ? eds.isLoadingSpaces() : false;
      untracked(() => this._spaceFetching.set(loading));
    });

    // Cascade: cf change clears org and space — but skip on null→non-null
    // transition so setInitialValuesFromAction's seed sequence (cf, org,
    // space written back-to-back) isn't wiped by the cascade firing on a
    // microtask after the org/space writes.
    let prevCf: string | null = this._cfSelected();
    effect(() => {
      const cf = this._cfSelected();
      if (cf === prevCf) { return; }
      const wasNull = prevCf === null;
      prevCf = cf;
      if (!wasNull) {
        untracked(() => {
          this._orgSelected.set(null);
          this._spaceSelected.set(null);
        });
      }
    });

    // Cascade: org change clears space — same null→non-null skip rule.
    let prevOrg: string | null = this._orgSelected();
    effect(() => {
      const org = this._orgSelected();
      if (org === prevOrg) { return; }
      const wasNull = prevOrg === null;
      prevOrg = org;
      if (!wasNull) {
        untracked(() => this._spaceSelected.set(null));
      }
    });

    // Auto-pick: opt-in singleton selection.
    effect(() => {
      if (!this._autoSelectEnabled()) { return; }
      const orgs = this.orgList();
      if (orgs.length === 1 && !untracked(() => this._orgSelected())) {
        untracked(() => this._orgSelected.set(orgs[0].guid));
      }
    });
    effect(() => {
      if (!this._autoSelectEnabled()) { return; }
      const spaces = this.spaceList();
      if (spaces.length === 1 && !untracked(() => this._spaceSelected())) {
        untracked(() => this._spaceSelected.set(spaces[0].guid));
      }
    });
  }

  /**
   * Augments a `WritableSignal<string | null>` with the `.next` and
   * `.asObservable` methods that the core list framework's
   * `IListMultiFilterConfig.select` slot still requires. Consumers read
   * via `select()` and write via `select.set(v)`; the augmentation is
   * only there so the framework binding keeps working. Retires when the
   * list framework multi-filter API migrates to Signal — see
   * `project_ilistmultifilterconfig_signal_debt`.
   */
  private augmentSelect(
    sig: WritableSignal<string | null>,
    kind: 'cf' | 'org' | 'space',
  ): WritableSignal<string | null> & {
    next: (v: string | null) => void;
    asObservable: () => Observable<string | null>;
  } {
    const obs = toObservable(sig);
    const augmented = sig as WritableSignal<string | null> & {
      next: (v: string | null) => void;
      asObservable: () => Observable<string | null>;
    };
    augmented.next = (v: string | null) => {
      sig.set(v);
      this.debug.log(`${kind}:select-change`, { to: v });
    };
    augmented.asObservable = () => obs;
    return augmented;
  }

  /**
   * Persisted-filter restoration plumbing for services-wall (and any
   * other caller of this method). Reads cf/org/space guids out of a
   * caller-supplied PaginatedAction's client-filter state and seeds the
   * select signals.
   */
  public setInitialValuesFromAction(
    paginatedAction: PaginatedAction,
    cfKey: string,
    orgKey: string,
    spaceKey: string,
  ) {
    this.initialValuesMap = (p: PaginationEntityState) => ({
      cf: p.clientPagination?.filter?.items[cfKey],
      org: p.clientPagination?.filter?.items[orgKey],
      space: p.clientPagination?.filter?.items[spaceKey]
    });
    this.initialValues$ = this.paginationMonitorFactory.create(
      paginatedAction.paginationKey,
      cfEntityFactory(paginatedAction.entityType),
      paginatedAction.flattenPagination
    ).pagination$.pipe(
      filter(p => !!p?.clientPagination?.filter),
    );

    this.initialValues$.pipe(
      take(1),
      map(this.initialValuesMap),
    ).subscribe(values => {
      this.debug.log('initialValues:resolved', values);
      if (values.cf) { this._cfSelected.set(values.cf); }
      if (values.org) { this._orgSelected.set(values.org); }
      if (values.space) { this._spaceSelected.set(values.space); }
    });
  }

  /**
   * Opt-in singleton auto-pick. After this is called, the next-arriving
   * org list with exactly one entry auto-selects that org; same for
   * spaces. Used by create-application; the add-service-instance wizard
   * does not call this so users always pick org/space explicitly.
   *
   * If a consumer has previously called setInitialValuesFromAction, those
   * persisted filter values are also seeded here so they take precedence
   * over the auto-pick (services-wall pattern).
   */
  public enableAutoSelectors() {
    this._autoSelectEnabled.set(true);

    if (this.initialValues$) {
      const map$ = this.initialValuesMap || ((a: any) => a);
      this.initialValues$.pipe(take(1), map(map$)).subscribe(values => {
        if (values.cf) { this._cfSelected.set(values.cf); }
        if (values.org) { this._orgSelected.set(values.org); }
        if (values.space) { this._spaceSelected.set(values.space); }
      });
    }
  }

  ngOnDestroy(): void {
    // Release acquired EndpointDataService handles. The registry refcounts —
    // other acquirers keep the drain alive; if we were the last, the
    // registry tears the EDS down.
    for (const cnsi of this._edsByCnsi().keys()) {
      this.endpointRegistry.release(cnsi);
    }
    this._edsByCnsi.set(new Map());
    this.destroy();
  }

  /**
   * No-op for signal-native consumers — effects auto-clean via Angular's
   * DestroyRef. Kept on the API surface because legacy callers invoke it
   * explicitly and removing it would be a separate breaking change.
   */
  destroy() { }
}
