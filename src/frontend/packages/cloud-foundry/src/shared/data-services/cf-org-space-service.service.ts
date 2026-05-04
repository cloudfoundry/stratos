import { Injectable, OnDestroy, Signal, WritableSignal, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { ListPaginationMultiFilterChange, naturalCompare, valueOrCommonFalsy } from '@stratosui/core';
import {
  connectedEndpointsOfTypesSelector,
  EndpointModel,
  PaginatedAction,
  PaginationEntityState,
  PaginationMonitorFactory,
  PaginationParam,
  ResetPagination,
  SetParams,
} from '@stratosui/store';
import { CFAppState } from '../../cf-app-state';
import { cfEntityFactory } from '../../cf-entity-factory';
import { IOrganization, ISpace } from '../../cf-api.types';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { QParam, QParamJoiners } from '../q-param';
import { CfOrgSpaceDebug, createCfOrgSpaceDebug } from './cf-org-space-debug';

export function spreadPaginationParams(params: PaginationParam): PaginationParam {
  return {
    ...params
  };
}


export function createCfOrgSpaceFilterConfig(key: string, label: string, cfOrgSpaceItem: CfOrgSpaceItem) {
  return {
    key,
    label,
    ...cfOrgSpaceItem,
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
 * Legacy CfOrgSpaceItem shape. The `list$` and `loading$` observables, and
 * the `select` BehaviorSubject, are signal-backed shims kept for consumers
 * that haven't migrated off rxjs yet. New consumers should read the
 * service's `orgList`/`spaceList` signals and write to the underlying
 * signals directly when those become public.
 */
export interface CfOrgSpaceItem<T = any> {
  list$: Observable<T[]>;
  loading$: Observable<boolean>;
  select: BehaviorSubject<string>;
}

export const createCfOrSpaceMultipleFilterFn = (
  store: Store<CFAppState>,
  action: PaginatedAction,
  setQParam: (setQ: QParam, qs: QParam[]) => boolean,
  preResetUpdate?: () => void
) => {
  return (changes: ListPaginationMultiFilterChange[], params: PaginationParam) => {
    if (!changes.length) {
      return;
    }
    const qParamStrings = (params.q || []) as string[];
    const qParamObject = QParam.fromStrings(qParamStrings);

    const startingCfGuid = valueOrCommonFalsy(action.endpointGuid);
    const startingOrgGuid = valueOrCommonFalsy(qParamObject.find((q: QParam) => q.key === 'organization_guid'), {}).value;
    const startingSpaceGuid = valueOrCommonFalsy(qParamObject.find((q: QParam) => q.key === 'space_guid'), {}).value;

    const qChanges = changes.reduce((qs: QParam[], change) => {
      switch (change.key) {
        case 'cf':
          action.endpointGuid = change.value;
          setQParam(new QParam('organization_guid', '', QParamJoiners.in), qs);
          setQParam(new QParam('space_guid', '', QParamJoiners.in), qs);
          break;
        case 'org':
          setQParam(new QParam('organization_guid', change.value, QParamJoiners.in), qs);
          break;
        case 'space':
          setQParam(new QParam('space_guid', change.value, QParamJoiners.in), qs);
          break;
      }
      return qs;
    }, qParamObject);

    const cfGuidChanged = startingCfGuid !== valueOrCommonFalsy(action.endpointGuid);
    const orgChanged = startingOrgGuid !== valueOrCommonFalsy(qChanges.find((q: QParam) => q.key === 'organization_guid'), {}).value;
    const spaceChanged = startingSpaceGuid !== valueOrCommonFalsy(qChanges.find((q: QParam) => q.key === 'space_guid'), {}).value;

    if (preResetUpdate) {
      preResetUpdate();
    }

    if (cfGuidChanged && !orgChanged && !spaceChanged) {
      store.dispatch(new ResetPagination(action, action.paginationKey));
    } else if (orgChanged || spaceChanged) {
      const newParams = spreadPaginationParams(params);
      newParams.q = qChanges.map(qChange => qChange.toString());
      store.dispatch(new SetParams(action, action.paginationKey, newParams, true, true));
    }
  };
};

interface InitialValues { cf: string; org: string; space: string; }

/**
 * Signal-native cf/org/space picker store.
 *
 * State of the world:
 * - Selection (`_cfSelected`, `_orgSelected`, `_spaceSelected`) and data
 *   (`_orgsByCnsi`, `_spacesByOrg`) are WritableSignals — single source of
 *   truth.
 * - Cascade (cf change clears org+space, org change clears space), HTTP
 *   fetches against V3 native handlers, and singleton auto-pick are all
 *   `effect()` reactions to those signals. No rxjs operators in the
 *   control flow.
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
  private http = inject(HttpClient);
  paginationMonitorFactory = inject(PaginationMonitorFactory);

  private debug: CfOrgSpaceDebug = createCfOrgSpaceDebug();

  // === Selection state (source of truth) ===
  private _cfSelected = signal<string | null>(null);
  private _orgSelected = signal<string | null>(null);
  private _spaceSelected = signal<string | null>(null);

  // === Data state ===
  private _orgsByCnsi = signal<Record<string, { guid: string; name: string }[]>>({});
  private _spacesByOrg = signal<Record<string, { guid: string; name: string }[]>>({});
  private _orgFetching = signal(false);
  private _spaceFetching = signal(false);
  private fetchedCnsis = new Set<string>();
  private fetchedOrgKeys = new Set<string>();

  private _autoSelectEnabled = signal(false);

  // === Connected CF endpoints ===
  // Leaf rxjs/ngrx bridge: the connected-endpoint store has no signal
  // replacement yet. One-line conversion, no operators in the control flow.
  private connectedCfList = toSignal(
    this.store.select(connectedEndpointsOfTypesSelector(CF_ENDPOINT_TYPE)).pipe(
      filter(endpoints => endpoints && !!Object.keys(endpoints).length),
      map(endpoints => Object.values(endpoints)
        .filter(e => e.cnsi_type === 'cf' && e.connectionStatus === 'connected')
        .sort((a, b) => naturalCompare(a.name, b.name))
      ),
    ),
    { initialValue: [] as EndpointModel[] }
  );

  // === Public derived signals ===
  /** Orgs for the currently-selected cnsi. Empty until fetch resolves. */
  public orgList: Signal<{ guid: string; name: string }[]> = computed(() => {
    const cnsi = this._cfSelected();
    if (!cnsi) { return []; }
    return this._orgsByCnsi()[cnsi] ?? [];
  });

  /** Spaces for the currently-selected (cnsi, org). Empty until fetch resolves. */
  public spaceList: Signal<{ guid: string; name: string }[]> = computed(() => {
    const cnsi = this._cfSelected();
    const org = this._orgSelected();
    if (!cnsi || !org) { return []; }
    return this._spacesByOrg()[`${cnsi}:${org}`] ?? [];
  });

  // === Public CfOrgSpaceItem shim API (legacy rxjs surface) ===
  public cf!: CfOrgSpaceItem<EndpointModel>;
  public org!: CfOrgSpaceItem<IOrganization>;
  public space!: CfOrgSpaceItem<ISpace>;
  public isLoading$: Observable<boolean>;

  // setInitialValuesFromAction support (services-wall persisted filter)
  public initialValues$!: Observable<any>;
  public initialValuesMap!: (param: any) => InitialValues;

  constructor() {
    this.debug.log('service:construct');

    // Build legacy shims. select is a BehaviorSubject backed by the signal;
    // list$/loading$ are toObservable(signal).
    this.cf = {
      list$: toObservable(this.connectedCfList) as Observable<EndpointModel[]>,
      loading$: toObservable(computed(() => this.connectedCfList().length === 0)),
      select: this.makeSelectShim(this._cfSelected, 'cf'),
    };
    this.org = {
      list$: toObservable(this.orgList) as Observable<IOrganization[]>,
      loading$: toObservable(this._orgFetching),
      select: this.makeSelectShim(this._orgSelected, 'org'),
    };
    this.space = {
      list$: toObservable(this.spaceList) as Observable<ISpace[]>,
      loading$: toObservable(this._spaceFetching),
      select: this.makeSelectShim(this._spaceSelected, 'space'),
    };
    this.isLoading$ = toObservable(computed(() =>
      this.connectedCfList().length === 0 || this._orgFetching() || this._spaceFetching()
    ));

    // === Effects ===

    // V3 orgs fetch on cf change. Each cnsi is fetched once.
    effect(() => {
      const cnsi = this._cfSelected();
      if (!cnsi || this.fetchedCnsis.has(cnsi)) { return; }
      this.fetchedCnsis.add(cnsi);
      untracked(() => this._orgFetching.set(true));
      this.http.get<{ resources: { guid: string; name: string }[] }>(
        `/pp/v1/cf/orgs/${cnsi}?per_page=500&page=1`,
      ).subscribe({
        next: resp => {
          this._orgsByCnsi.update(m => ({ ...m, [cnsi]: resp.resources ?? [] }));
          this._orgFetching.set(false);
        },
        error: () => this._orgFetching.set(false),
      });
    });

    // V3 spaces fetch on org change. Each (cnsi, org) is fetched once.
    effect(() => {
      const cnsi = this._cfSelected();
      const orgGuid = this._orgSelected();
      if (!cnsi || !orgGuid) { return; }
      const key = `${cnsi}:${orgGuid}`;
      if (this.fetchedOrgKeys.has(key)) { return; }
      this.fetchedOrgKeys.add(key);
      untracked(() => this._spaceFetching.set(true));
      this.http.get<{ resources: { guid: string; name: string }[] }>(
        `/pp/v1/cf/org/${cnsi}/${orgGuid}/spaces?per_page=500&page=1`,
      ).subscribe({
        next: resp => {
          this._spacesByOrg.update(m => ({ ...m, [key]: resp.resources ?? [] }));
          this._spaceFetching.set(false);
        },
        error: () => this._spaceFetching.set(false),
      });
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
   * Legacy BehaviorSubject shim backed by a WritableSignal. Calling
   * `.next(v)` writes the signal; the signal is the source of truth for
   * the cascade and auto-pick effects. Signal updates emit on the
   * BehaviorSubject so existing `| async` and `.subscribe()` consumers
   * keep working. Retire this shim when consumers migrate to signals.
   */
  private makeSelectShim(sig: WritableSignal<string | null>, kind: 'cf' | 'org' | 'space'): BehaviorSubject<string> {
    const bs = new BehaviorSubject<string>(sig() as any);
    const innerNext = bs.next.bind(bs);
    effect(() => {
      const v = sig();
      innerNext(v as any);
      this.debug.log(`${kind}:select-change`, { to: v });
    });
    bs.next = (v: string) => sig.set(v as any);
    bs.getValue = () => sig() as any;
    return bs;
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
    this.destroy();
  }

  /**
   * No-op for signal-native consumers — effects auto-clean via Angular's
   * DestroyRef. Kept on the API surface because legacy callers invoke it
   * explicitly and removing it would be a separate breaking change.
   */
  destroy() { }
}
