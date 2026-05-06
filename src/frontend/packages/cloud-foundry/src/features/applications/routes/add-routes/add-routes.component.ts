import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  inject,
  computed,
  Signal,
  WritableSignal,
} from '@angular/core';
import { Validators, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { of, Subscription } from 'rxjs';
import { filter, startWith, switchMap, tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { CFAppState } from '../../../../cf-app-state';
import { domainEntityType, spaceEntityType } from '../../../../cf-entity-types';
import { createEntityRelationKey } from '../../../../entity-relations/entity-relations.types';
import {
  CustomFormFieldComponent,
  CustomSelectComponent,
  CustomOptionComponent,
  CustomCheckboxComponent,
  FocusDirective,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalStepHandle,
} from '@stratosui/core';
import { RouterNav, APIResource } from '@stratosui/store';
import { IDomain } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ApplicationService } from '../../application.service';
import { AppDetailDataService } from '../../app-detail-data.service';
import {
  AppRouteActionsService,
  CreateRouteRequest,
} from '../../../../shared/services/app-route-actions.service';
import {
  CfMapRoutesSignalConfigService,
} from '../../../../shared/components/list/list-types/app-route/cf-map-routes-signal-config.service';
import type { StRoute } from '../../../../services/endpoint-data/stratos-types';

const hostPattern = '^([\\w\\-\\.]*)$';
const pathPattern = `^([\\w\\-\\/\\!\\#\\[\\]\\@\\&\\$\\'\\(\\)\\*\\+\\;\\=\\,]*)$`;

/**
 * AddRoutesComponent — single-screen redesign.
 *
 * Renders three sections in one pane:
 *   1. "Already attached to this app" — read-only list of routes whose
 *      destinations include this app. Hidden when empty.
 *   2. "Available routes in this space" — picker over routes the user
 *      could attach (detached + attached-to-other-apps). Single-row
 *      radio select.
 *   3. "Or create a new route" — the existing domain/host/path/port
 *      form, branched on the selected domain's router_group_type.
 *
 * Both lists drain from the same `GET /pp/v1/cf/routes/{cnsi}?space_guids=`
 * call (eager on stepper mount via ngOnInit). The split between attached
 * and available is computed at the picker service layer, keyed off the
 * current app's GUID.
 *
 * Submit dispatch:
 *   - Row selected in the available list → attachRoute(guid)
 *   - Otherwise (and form valid) → createAndAttachRoute(req)
 *   The two paths are mutually exclusive at the validate() layer.
 *
 * Client-side collision detection: as the user types host/path (HTTP) or
 * port (TCP), `hostCollision` checks the loaded available-routes signal
 * for a match on (host, domainGuid, path) for HTTP or (domainGuid, port)
 * for TCP. A match disables submit and surfaces an inline message
 * pointing at the existing row — covers the 99%+ of conflicts that live
 * in the same space (the only space the user can act on anyway).
 *
 * 422 classification on submit: cross-space collisions and other
 * uniqueness errors return as 422 with CF error codes 210003/210004/
 * 210005. We translate those to a generic "Route name is unavailable"
 * message; other 422s pass through CF's `detail` verbatim. No cross-space
 * lookup — RBAC blind spots make precise topology messaging impossible
 * without info leaks.
 *
 * Orphan-on-attach-fail (create succeeds, attach fails): the action
 * service throws an error whose message names the orphan route GUID + URL
 * verbatim; the rejection propagates up through signalHandle.submit to
 * the stepper which surfaces it via the existing snackbar plumbing.
 */
@Component({
  selector: 'app-add-routes',
  templateUrl: './add-routes.component.html',
  styleUrls: ['./add-routes.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomCheckboxComponent,
    FocusDirective,
    SignalListComponent,
  ],
})
export class AddRoutesComponent implements OnInit, OnDestroy {
  private applicationService = inject(ApplicationService);
  private dataService = inject(AppDetailDataService);
  private actions = inject(AppRouteActionsService);
  private mapRoutesConfig = inject(CfMapRoutesSignalConfigService);
  private store = inject<Store<CFAppState>>(Store);

  subscriptions: Subscription[] = [];
  domains: APIResource<IDomain>[] = [];

  addTCPRoute: FormGroup<{
    port: FormControl<string>;
    useRandomPort: FormControl<boolean>;
  }>;
  addHTTPRoute: FormGroup<{
    host: FormControl<string>;
    path: FormControl<string>;
  }>;
  domainFormGroup: FormGroup<{
    domain: FormControl<APIResource<IDomain> | ''>;
  }>;

  appGuid: string;
  cfGuid: string;
  spaceGuid!: string;
  selectedDomain!: APIResource<IDomain>;
  appUrl: string;

  useRandomPort = false;

  /** Picker config for the "Available routes in this space" list. */
  readonly mapListConfig: SignalListConfig<StRoute>;
  /** Read-only config for the "Already attached to this app" list. */
  readonly attachedListConfig: SignalListConfig<StRoute>;

  /** True when the user has clicked a row in the available list. */
  readonly hasSelectedRoute: Signal<boolean> = computed(
    () => this.mapRoutesConfig.selectedKey() !== null,
  );

  /**
   * Client-side collision check. Returns the matching `StRoute` from the
   * loaded available-in-space list when the form's host/path/port/domain
   * combination collides with an existing detached or other-app route.
   * `null` when no collision (or when the form isn't filled enough to
   * compare). Catches the 99%+ same-space conflict cases without an extra
   * round trip; cross-space conflicts still surface via 422 classification
   * at submit time.
   */
  readonly hostCollision!: Signal<StRoute | null>;

  /**
   * Render mode for the "Already attached to this app" section. Three
   * states keyed off the count of attached routes so the section stays
   * out of the user's way when there's nothing to show, inlines for
   * small counts where the list is comfortable to read at a glance, and
   * collapses behind an accordion for larger counts so the create form
   * stays above the fold.
   *
   *   0 routes  → 'hidden'   (section not rendered)
   *   1-3       → 'inline'   (rows visible, no accordion)
   *   4+        → 'collapsed' (accordion summary "Already attached (N)")
   */
  readonly attachedDisplayMode: Signal<'hidden' | 'inline' | 'collapsed'> = computed(() => {
    const n = this.mapRoutesConfig.attachedRoutes().length;
    if (n === 0) return 'hidden';
    if (n <= 3) return 'inline';
    return 'collapsed';
  });

  /** Local accordion-open state for the collapsed mode. */
  readonly attachedListExpanded: WritableSignal<boolean> = signal(false);

  // Signal-native step handle exposed to the parent stepper template.
  signalHandle!: SignalStepHandle;

  constructor() {
    const applicationService = this.applicationService;
    this.appGuid = applicationService.appGuid;
    this.cfGuid = applicationService.cfGuid;
    this.appUrl = `/applications/${this.cfGuid}/${this.appGuid}/routes`;

    this.domainFormGroup = new FormGroup({
      domain: new FormControl<APIResource<IDomain> | ''>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });

    this.addHTTPRoute = new FormGroup({
      host: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(hostPattern), Validators.maxLength(63)],
      }),
      path: new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(pathPattern), Validators.maxLength(128)],
      }),
    });

    this.addTCPRoute = new FormGroup({
      port: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern('[0-9]*')],
      }),
      useRandomPort: new FormControl(false, { nonNullable: true }),
    });

    // Track each form's status as a signal so signalHandle.valid recomputes
    // reactively when any control transitions VALID/INVALID. Mirrors the
    // pre-rebuild graph; the difference is the verb call below.
    const httpStatus = toSignal(this.addHTTPRoute.statusChanges.pipe(startWith(this.addHTTPRoute.status)),
      { initialValue: this.addHTTPRoute.status });
    const tcpStatus = toSignal(this.addTCPRoute.statusChanges.pipe(startWith(this.addTCPRoute.status)),
      { initialValue: this.addTCPRoute.status });
    const domainStatus = toSignal(this.domainFormGroup.statusChanges.pipe(startWith(this.domainFormGroup.status)),
      { initialValue: this.domainFormGroup.status });

    // Form value signals so `hostCollision` recomputes on every keystroke.
    const httpVal = toSignal(this.addHTTPRoute.valueChanges.pipe(startWith(this.addHTTPRoute.value)),
      { initialValue: this.addHTTPRoute.value });
    const tcpVal = toSignal(this.addTCPRoute.valueChanges.pipe(startWith(this.addTCPRoute.value)),
      { initialValue: this.addTCPRoute.value });
    const domainVal = toSignal(this.domainFormGroup.controls.domain.valueChanges.pipe(
      startWith(this.domainFormGroup.controls.domain.value)),
      { initialValue: this.domainFormGroup.controls.domain.value });

    (this as { hostCollision: Signal<StRoute | null> }).hostCollision = computed(() => {
      const domain = domainVal();
      if (!domain || typeof domain === 'string') return null;
      const domainGuid = domain.metadata.guid;
      const isTcp = domain.entity.router_group_type === 'tcp';
      const available = this.mapRoutesConfig.availableRoutes();
      if (!available.length) return null;

      if (isTcp) {
        const v = tcpVal();
        if (v?.useRandomPort) return null; // can't predict random
        const portStr = (v?.port ?? '').trim();
        if (!portStr) return null;
        const port = parseInt(portStr, 10);
        if (isNaN(port)) return null;
        return available.find(r => r.domainGuid === domainGuid && (r.port ?? 0) === port) ?? null;
      }

      const v = httpVal();
      const host = (v?.host ?? '').trim();
      if (!host) return null;
      let path = v?.path ?? '';
      if (path && path.length && path[0] !== '/') path = '/' + path;
      return available.find(r =>
        r.domainGuid === domainGuid
        && (r.host ?? '') === host
        && (r.path ?? '') === path,
      ) ?? null;
    });

    this.signalHandle = {
      valid: computed(() => {
        // Touch every reactive source so the signal graph re-runs on any
        // input/form transition, then defer to validate().
        void httpStatus(); void tcpStatus(); void domainStatus();
        void this.hasSelectedRoute(); void this.hostCollision();
        return this.validate();
      }),
      submit: async () => {
        await this.runSubmit();
      },
      blocked: computed(() => this.actions.inFlight()),
    };

    // Build the picker (Available routes) config from the picker service.
    // Sort/view-mode/pagination are owned by the service's tab-scoped state.
    const columns: SignalListColumn<StRoute>[] = this.mapRoutesConfig.buildColumns();
    this.mapListConfig = {
      pagedItems: this.mapRoutesConfig.view.pagedItems,
      totalFilteredResults: this.mapRoutesConfig.view.totalFilteredResults,
      totalPages: this.mapRoutesConfig.view.totalPages,
      pageIndex: this.mapRoutesConfig.pageIndex,
      pageSize: this.mapRoutesConfig.pageSize,
      isAnyLoading: signal(false).asReadonly(),
      errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
      columns,
      getRowKey: (row: StRoute) => row.guid,
      emptyMessage: 'No routes available to map in this space',
      emptyFilterMessage: 'No routes match the current filter',
      loadingMessage: 'Loading routes…',
      // Smallest option matches the picker's default page size — the
      // stepper sits between a form and the attached list, so we want
      // compact-by-default with room to grow. Larger options still on
      // hand for spaces with many routes.
      pageSizeOptions: {
        table: [5, 10, 25, 50],
        card: [6, 12, 24, 48],
      },
      nameFilter: this.mapRoutesConfig.nameFilter,
      onRefresh: () => this.mapRoutesConfig.refresh(),
      onClear: () => this.mapRoutesConfig.clearFilters(),
      viewMode: this.mapRoutesConfig.viewMode,
      sort: this.mapRoutesConfig.sort,
    };

    // Read-only "Already attached" list. Reuses the picker's column shape
    // minus the radio (no action) and feeds directly off the
    // `attachedRoutes` signal — no pagination/filter pipeline.
    const attachedColumns = columns.filter(c => c.kind !== 'radio');
    const attachedRoutesSignal = this.mapRoutesConfig.attachedRoutes;
    this.attachedListConfig = {
      pagedItems: attachedRoutesSignal,
      totalFilteredResults: computed(() => attachedRoutesSignal().length),
      totalPages: computed(() => 1),
      pageIndex: signal(0),
      pageSize: signal(100),
      isAnyLoading: signal(false).asReadonly(),
      errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
      columns: attachedColumns,
      getRowKey: (row: StRoute) => row.guid,
      emptyMessage: '',
      emptyFilterMessage: '',
      loadingMessage: 'Loading…',
      // Hide the paginator when the list is small.
      pageSizeOptions: {
        table: [100],
        card: [100],
      },
      viewMode: signal('table'),
    };
  }

  ngOnInit() {
    this.subscriptions.push(this.addTCPRoute.valueChanges.subscribe(val => {
      const useRandomPort = val.useRandomPort ?? false;
      if (useRandomPort !== this.useRandomPort) {
        this.useRandomPort = useRandomPort;
        const validators = [
          Validators.required,
          Validators.pattern('[0-9]*'),
        ];
        this.addTCPRoute.controls.port.setValidators(useRandomPort ? [] : validators);
        if (useRandomPort) {
          this.addTCPRoute.controls.port.disable();
        } else {
          this.addTCPRoute.controls.port.enable();
        }
      }
    }));

    const space$ = this.applicationService.orgDomains$.pipe(
      // We don't need the domains, but we need them fetched first so we get the router_group_type
      switchMap(() => this.applicationService.waitForAppEntity$
        .pipe(
          switchMap(app => {
            this.spaceGuid = app.entity.entity.space_guid;
            // Guard against cfEntityCatalog being uninitialized in unit-test
            // isolation — the legacy `cfEntityCatalog.space.store` lookup
            // throws if the catalog hasn't seeded yet. Skip the domain-list
            // hydration in that case; the picker still works because the
            // template binds to `domains` which stays empty.
            const entityService = cfEntityCatalog?.space?.store?.getEntityService?.(
              app.entity.entity.space_guid,
              app.entity.entity.cfGuid,
              { includeRelations: [createEntityRelationKey(spaceEntityType, domainEntityType)] },
            );
            return entityService ? entityService.waitForEntity$ : of();
          }),
          filter(({ entity }) => !!entity.entity.domains),
          tap(({ entity }) => {
            this.domains = [];
            const domains = entity.entity.domains;
            domains.forEach(domain => {
              this.domains.push(domain);
            });
            this.selectedDomain = Object.values(this.domains)[0];
            // Set initial domain value in the form
            if (this.selectedDomain) {
              this.domainFormGroup.patchValue({ domain: this.selectedDomain });
            }
          })
        )
      ));

    this.subscriptions.push(space$.subscribe());

    // Subscribe to domain form changes to update selectedDomain so the
    // template's TCP/HTTP branching reacts.
    this.subscriptions.push(
      this.domainFormGroup.controls.domain.valueChanges.subscribe(domain => {
        if (domain && typeof domain !== 'string') {
          this.selectedDomain = domain;
        }
      })
    );

    // Eagerly drain the space's routes for both lists. The two-list
    // single-screen redesign needs this on entry rather than gated on a
    // radio toggle. Idempotent: refresh() returns early until appDetail
    // resolves, so calling here-and-now is safe even before the app
    // entity has populated.
    void this.mapRoutesConfig.refresh();
    // Re-drain when appDetail.spaceGuid first lands (covers the cold-load
    // race where ngOnInit fires before the cnsi+space are bound).
    this.subscriptions.push(
      this.applicationService.waitForAppEntity$.pipe(
        filter(app => !!app?.entity?.entity?.space_guid),
      ).subscribe(() => { void this.mapRoutesConfig.refresh(); }),
    );
  }

  /**
   * The submit gate. The user has two mutually exclusive intents:
   *   - Pick a row from the available list → attach.
   *   - Fill the form → create-and-attach.
   * If a row is selected, the form's validity doesn't matter. If no row
   * is selected, the active form (HTTP vs TCP) must be valid AND there
   * must be no client-side host/port collision against the available
   * list.
   */
  validate(): boolean {
    if (this.hasSelectedRoute()) {
      return true;
    }
    const formValid = this.isTCPRouteCreation()
      ? this.addTCPRoute.valid
      : this.addHTTPRoute.valid;
    if (!formValid) return false;
    return this.hostCollision() === null;
  }

  isTCPRouteCreation(): boolean {
    const domain = this.domainFormGroup.value.domain;
    return !!domain && typeof domain !== 'string' && domain.entity.router_group_type === 'tcp';
  }

  /**
   * Submit dispatch. Row-selected wins over the form (validate() ensures
   * the two intents don't both produce valid=true). Resolves on success
   * (signalHandle.submit unwraps), rejects with an Error to surface the
   * message via stepper snackbar.
   */
  async runSubmit(): Promise<void> {
    if (this.hasSelectedRoute()) {
      await this.runAttachExisting();
    } else {
      await this.runCreateAndAttach();
    }
  }

  /** Create a new route in the selected domain + attach to the app. */
  private async runCreateAndAttach(): Promise<void> {
    const domain = this.domainFormGroup.value.domain;
    const domainGuid = domain && typeof domain !== 'string' ? domain.metadata.guid : '';
    if (!domainGuid) {
      throw new Error('Failed to add route: domain is required');
    }
    const isTcp = this.isTCPRouteCreation();
    const req: CreateRouteRequest = {
      relationships: {
        space: { data: { guid: this.spaceGuid } },
        domain: { data: { guid: domainGuid } },
      },
    };
    if (isTcp) {
      const useRandomPort = this.addTCPRoute.value.useRandomPort ?? false;
      if (!useRandomPort) {
        const portVal = this.addTCPRoute.value.port ?? '';
        const portNum = parseInt(portVal, 10);
        if (!isNaN(portNum)) {
          req.port = portNum;
        }
      }
      // useRandomPort=true → omit `port` so V3 picks one (RouteCreateRequest.Port = *int).
    } else {
      const host = (this.addHTTPRoute.value.host ?? '').trim();
      let path = this.addHTTPRoute.value.path ?? '';
      if (path && path.length && path[0] !== '/') {
        path = '/' + path;
      }
      // Host is required for HTTP routes per the form's Validators.required;
      // include it as-is. Path is optional (empty string allowed).
      if (host) req.host = host;
      if (path) req.path = path;
    }

    let created: StRoute;
    try {
      created = await this.actions.createAndAttachRoute(req);
    } catch (err) {
      // Translate uniqueness errors (CF v3 codes 210003 RouteHostTaken /
      // 210004 RoutePathTaken / 210005 RoutePortTaken) into a generic
      // "name unavailable" message — the typical case is a same-tuple
      // route in another space we can't surface details on without
      // info-leak. Same-space cases are caught client-side via
      // hostCollision and never reach this branch. Other 422 details
      // (invalid host, quota exceeded, etc.) pass through verbatim;
      // orphan-on-attach-fail messages too.
      throw new Error(this.classifyCreateError(err));
    }
    this.dataService.addRoute(created);
    this.store.dispatch(new RouterNav({ path: ['/applications', this.cfGuid, this.appGuid, 'routes'] }));
  }

  /**
   * Map a thrown error from createAndAttachRoute into a user-facing
   * message. CF v3 returns 422 with `errors[].code` for uniqueness
   * conflicts (210003/210004/210005); we translate those without leaking
   * the colliding route's space/org. Any other shape passes the original
   * message through.
   */
  private classifyCreateError(err: unknown): string {
    const e = err as { message?: string; status?: number; error?: unknown };
    const status = e?.status ?? 0;
    if (status === 422) {
      const code = this.extractCfErrorCode(e?.error);
      if (code === 210003 || code === 210004 || code === 210005) {
        return 'Route name is unavailable. Please choose another.';
      }
    }
    return e?.message ?? 'Failed to add route';
  }

  /**
   * CF v3 error envelopes nest as `{ errors: [{ code, title, detail }] }`.
   * Stratos's HttpClient surfaces this on `HttpErrorResponse.error`,
   * sometimes already parsed and sometimes as a JSON string depending on
   * the route through Jetstream's proxy. Tolerate both.
   */
  private extractCfErrorCode(payload: unknown): number | null {
    if (!payload) return null;
    let body: unknown = payload;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return null; }
    }
    const arr = (body as { errors?: { code?: number }[] })?.errors;
    if (!Array.isArray(arr) || !arr.length) return null;
    const code = arr[0]?.code;
    return typeof code === 'number' ? code : null;
  }

  /** Attach an existing route (the row currently selected in the picker). */
  private async runAttachExisting(): Promise<void> {
    const selectedKey = this.mapRoutesConfig.selectedKey();
    if (!selectedKey) {
      throw new Error('Failed to map route: no route selected');
    }
    const selected = this.mapRoutesConfig.view.pagedItems().find(r => r.guid === selectedKey)
      ?? this.mapRoutesConfig.routes().find(r => r.guid === selectedKey);
    if (!selected) {
      throw new Error('Failed to map route: selected route not found');
    }
    try {
      await this.actions.attachRoute(selected.guid);
    } catch (err) {
      const msg = (err as Error)?.message ?? 'Failed to map route';
      throw new Error(msg);
    }
    // Use the picker's locally-held StRoute (backend returns empty 200 from
    // attach). The picker's drain stamps cnsiGuid via toStRoute server-side.
    this.dataService.addRoute(selected);
    this.store.dispatch(new RouterNav({ path: ['/applications', this.cfGuid, this.appGuid, 'routes'] }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
