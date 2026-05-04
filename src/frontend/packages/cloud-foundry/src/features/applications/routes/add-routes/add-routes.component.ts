import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  inject,
  computed,
  Signal,
} from '@angular/core';
import { Validators, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { of, Subscription } from 'rxjs';
import { filter, startWith, switchMap, tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { CFAppState } from '../../../../cf-app-state';
import { domainEntityType, spaceEntityType } from '../../../../cf-entity-types';
import { createEntityRelationKey } from '../../../../entity-relations/entity-relations.types';
import { RouteMode } from '../../../../store/types/route.types';
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
 * AddRoutesComponent — slice 3.5 signal-native rebuild.
 *
 * Replaces the legacy ngrx-backed verbs (`cfEntityCatalog.route.api.create`,
 * `cfEntityCatalog.application.api.assignRoute`) with direct calls into
 * `AppRouteActionsService.createAndAttachRoute(...)` / `attachRoute(...)`.
 *
 * Replaces `<app-map-routes>` (which itself wrapped `<app-list>` driven by
 * `CfAppMapRoutesListConfigService`) with `<app-signal-list>` driven by the
 * tab-scoped `CfMapRoutesSignalConfigService`. Stepper UX is preserved
 * exactly — the same form layout, same Cancel/Finish buttons, same
 * `signalHandle.valid` / `signalHandle.submit` contract that wires into
 * `<app-step>`.
 *
 * On verb success, calls `dataService.addRoute(returnedStRoute)` then
 * dispatches `RouterNav` back to the Routes tab. The `addRoute` mutation
 * hook updates BOTH the per-app routes signal and the appDetail.app.routes
 * compose so the returning Routes tab + build-tab Routes count rerender
 * synchronously.
 *
 * Orphan-on-attach-fail (create succeeds, attach fails): the action
 * service throws an error whose message names the orphan route GUID + URL
 * verbatim. We let the rejection propagate up through `signalHandle.submit`
 * to the stepper which surfaces it via the existing snackbar plumbing.
 * No auto-delete — the user manually cleans up.
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

  // Map-vs-create radio modes. Backed by a signal so the SignalStepHandle.valid
  // computed reruns when the user toggles.
  addRouteModes: RouteMode[] = [
    { id: 'create', label: 'Create and map new route', submitLabel: 'Create' },
    { id: 'map', label: 'Map existing route', submitLabel: 'Map' },
  ];
  private _addRouteMode = signal<RouteMode | null>(null);
  get addRouteMode(): RouteMode { return this._addRouteMode()!; }
  set addRouteMode(v: RouteMode) {
    this._addRouteMode.set(v);
    // Drain the picker on first transition into 'map'. Idempotent — safe to
    // call repeatedly; the service replaces `_routes` on each successful
    // response.
    if (v?.id === 'map') {
      void this.mapRoutesConfig.refresh();
    }
  }
  useRandomPort = false;

  /** SignalListConfig built from the tab-scoped picker config service. */
  readonly mapListConfig: SignalListConfig<StRoute>;

  /** True when in 'map' mode the user has picked a row. */
  readonly hasSelectedRoute: Signal<boolean> = computed(
    () => this.mapRoutesConfig.selectedKey() !== null,
  );

  // Signal-native step handle exposed to the parent stepper template.
  signalHandle!: SignalStepHandle;

  constructor() {
    const applicationService = this.applicationService;
    this.appGuid = applicationService.appGuid;
    this.cfGuid = applicationService.cfGuid;
    this.appUrl = `/applications/${this.cfGuid}/${this.appGuid}/routes`;
    this.addRouteMode = this.addRouteModes[0];

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

    this.signalHandle = {
      valid: computed(() => {
        // Touch every reactive source so the signal graph re-runs on any
        // input/form transition, then defer to validate().
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        httpStatus(); tcpStatus(); domainStatus();
        this._addRouteMode(); this.hasSelectedRoute();
        return this.validate();
      }),
      submit: async () => {
        await this.runSubmit();
      },
      blocked: computed(() => this.actions.inFlight()),
    };

    // Build the signal-list config off the picker service. Sort and view-mode
    // are owned by the picker service's tab-scoped state; pagination is
    // local to the picker too.
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
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.mapRoutesConfig.nameFilter,
      onRefresh: () => this.mapRoutesConfig.refresh(),
      onClear: () => this.mapRoutesConfig.clearFilters(),
      viewMode: this.mapRoutesConfig.viewMode,
      sort: this.mapRoutesConfig.sort,
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
  }

  validate(): boolean {
    if (this.addRouteMode && this.addRouteMode.id === 'create') {
      return this.isTCPRouteCreation()
        ? this.addTCPRoute.valid
        : this.addHTTPRoute.valid;
    }
    return this.hasSelectedRoute();
  }

  isTCPRouteCreation(): boolean {
    const domain = this.domainFormGroup.value.domain;
    return !!domain && typeof domain !== 'string' && domain.entity.router_group_type === 'tcp';
  }

  /**
   * Submit dispatch: route to create-and-attach or attach-existing based on
   * the current mode. Resolves on success (signalHandle.submit unwraps),
   * rejects with an Error to surface the message via stepper snackbar.
   */
  async runSubmit(): Promise<void> {
    if (this.addRouteMode && this.addRouteMode.id === 'create') {
      await this.runCreateAndAttach();
    } else {
      await this.runAttachExisting();
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
      // Pass the message through verbatim — orphan-on-attach-fail messages
      // already include the orphan route GUID + URL, formatted by the
      // action service. The stepper surfaces this in the snackbar.
      const msg = (err as Error)?.message ?? 'Failed to add route';
      throw new Error(msg);
    }
    this.dataService.addRoute(created);
    this.store.dispatch(new RouterNav({ path: ['/applications', this.cfGuid, this.appGuid, 'routes'] }));
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
