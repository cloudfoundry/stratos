import {
  DestroyRef,
  Injectable,
  Injector,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import { ListStateStore, SignalListConfig, SignalListColumn } from '@stratosui/core';

import { canUpdateOrgSpaceRoles } from '../../../../../features/cf/cf.helpers';
import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import { OrgDataRegistry } from '../../../../../services/endpoint-data/org-data.registry';
import { OrgDataService } from '../../../../../services/endpoint-data/org-data.service';
import type { StSpace } from '../../../../../services/endpoint-data/stratos-types';
import { SortSpec, ViewPipeline } from '../../../../../services/data-sources/view-pipeline';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';

// Signal-native list config for the manage-users wizard "Modify Roles"
// step — the spaces table where managers/auditors/developers checkboxes
// live. Replaces CfUsersSpaceRolesListConfigService +
// CfUsersSpaceRolesDataSourceService (ngrx ListDataSource over the V2
// GetAllOrganizationSpacesWithOrgs action).
//
// Rows are StSpace from OrgDataRegistry — the same signal-native source
// the org-detail page uses. The list narrows to spaces the connected
// user can edit roles in (canUpdateOrgSpaceRoles) and, when the wizard
// was launched at space scope, to the single locked space.
//
// The three role columns are kind:'template' — the wrapper component
// projects three <ng-template appSignalListCell="manager|auditor|
// developer"> blocks that render the existing CfRoleCheckboxComponent
// inline, preserving the wizard's reducer + dispatch surface.
@Injectable()
export class CfUsersSpaceRolesSignalConfigService {
  private readonly registry = inject(OrgDataRegistry);
  private readonly rolesData = inject(CfUsersRolesDataService);
  private readonly activeRoute = inject(ActiveRouteCfOrgSpace);
  private readonly userPerms = inject(CurrentUserPermissionsService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state = inject(ListStateStore).bind('cf-users-space-roles', {
    viewMode: 'table',
    pageSize: [25, 25],
    pageIndex: [0, 0],
    sort: [
      { field: 'name', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ],
  });

  readonly nameFilter: WritableSignal<string> = signal('');
  readonly filter: WritableSignal<(s: StSpace) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StSpace>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly viewMode = this.state.viewMode;

  // Held in a signal so the spaces pump-effect reacts when bindOrg
  // swaps the OrgDataService for a different org mid-wizard. Plain
  // field would not trigger the effect.
  private readonly _orgDataService: WritableSignal<OrgDataService | null> = signal(null);
  private get orgDataService(): OrgDataService | null { return this._orgDataService(); }
  // Map of space.guid -> canEdit. Resolved per space the first time it
  // appears via canUpdateOrgSpaceRoles; cached so the editable filter
  // doesn't re-subscribe on every spaces() tick.
  private readonly _canEditByGuid: WritableSignal<ReadonlyMap<string, boolean>> = signal(new Map());

  // Org GUID the wizard is rolled into — populated once newRoles fires.
  // Held in a signal so the spaces source can rewire when the user picks
  // a different org mid-wizard.
  private readonly _orgGuid: WritableSignal<string> = signal('');

  // All spaces in the wizard's org, raw from the OrgDataRegistry feed.
  // Narrowed downstream by editability + the optional spaceGuid lock.
  private readonly _rawSpaces: WritableSignal<StSpace[]> = signal([]);

  readonly spaces: Signal<StSpace[]> = computed(() => {
    const all = this._rawSpaces();
    const canEdit = this._canEditByGuid();
    const spaceLock = this.activeRoute.spaceGuid;
    return all.filter(s => canEdit.get(s.guid) === true && (!spaceLock || s.guid === spaceLock));
  });

  readonly hasLoadedOnce: Signal<boolean>;
  private readonly _hasLoadedOnce = signal(false);

  view!: ViewPipeline<StSpace>;
  private readonly _sortExtractors: WritableSignal<Map<string, (row: StSpace) => unknown>> = signal(new Map());

  // Mirror of legacy `initialised$` — the wrapper component holds the
  // dynamic insertion until this flips true, matching the original
  // BehaviorSubject<boolean> contract that gated <app-list> rendering.
  readonly initialised: Signal<boolean>;

  private permCheckSub?: Subscription;

  constructor() {
    this.hasLoadedOnce = this._hasLoadedOnce.asReadonly();
    this.initialised = computed(() => !!this._orgDataService() && !!this._orgGuid());

    this.view = new ViewPipeline<StSpace>(
      this.spaces,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      // newRoles().orgGuid is the wizard-picked org. When it changes,
      // acquire that org's data service and start pumping its spaces
      // into _rawSpaces. Kept outside of any nested effect so the
      // registered effects below stay singletons across rebinds.
      effect(() => {
        const orgGuid = this.rolesData.newRoles()?.orgGuid;
        if (!orgGuid) return;
        if (orgGuid === this._orgGuid()) return;
        this.bindOrg(orgGuid);
      });

      // Pump the bound OrgDataService's spaces signal into _rawSpaces.
      // Re-runs automatically when bindOrg swaps the service (the
      // _orgDataService signal change propagates here).
      effect(() => {
        const svc = this._orgDataService();
        const spaces = svc?.spaces() ?? [];
        this._rawSpaces.set(spaces);
        if (svc) this._hasLoadedOnce.set(true);
      });

      // Resolve canEdit for each new space lazily — every time _rawSpaces
      // changes, look up canUpdateOrgSpaceRoles for spaces we haven't
      // checked yet.
      effect(() => {
        const all = this._rawSpaces();
        const known = this._canEditByGuid();
        const pending = all.filter(s => !known.has(s.guid));
        if (pending.length === 0) return;
        for (const s of pending) {
          this.permCheckSub = canUpdateOrgSpaceRoles(
            this.userPerms,
            s.cnsiGuid,
            s.orgGuid,
            s.guid,
          ).pipe(take(1)).subscribe(canEdit => {
            this._canEditByGuid.update(curr => {
              const next = new Map(curr);
              next.set(s.guid, canEdit);
              return next;
            });
          });
        }
      });

      // Filter effect — name filter just substring-matches space name.
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((s: StSpace) => !q || (s.name ?? '').toLowerCase().includes(q));
      });
    });

    this.destroyRef.onDestroy(() => {
      this.permCheckSub?.unsubscribe();
      const og = this._orgGuid();
      if (og && this._orgDataService()) {
        this.registry.release(this.activeRoute.cfGuid, og);
      }
    });
  }

  private bindOrg(orgGuid: string): void {
    const prevOrg = this._orgGuid();
    if (this._orgDataService() && prevOrg) {
      this.registry.release(this.activeRoute.cfGuid, prevOrg);
    }
    this._orgGuid.set(orgGuid);
    const svc = this.registry.acquire(this.activeRoute.cfGuid, orgGuid);
    this._orgDataService.set(svc);
    void firstValueFrom(svc.load()).catch((): void => undefined);
  }

  buildConfig(): SignalListConfig<StSpace> {
    const columns: SignalListColumn<StSpace>[] = [
      {
        header: 'Space',
        key: 'name',
        kind: 'text',
        sortField: 'name',
        render: s => s.name,
      },
      {
        header: 'Manager',
        key: 'manager',
        kind: 'template',
        templateName: 'manager',
        render: () => '',
      },
      {
        header: 'Auditor',
        key: 'auditor',
        kind: 'template',
        templateName: 'auditor',
        render: () => '',
      },
      {
        header: 'Developer',
        key: 'developer',
        kind: 'template',
        templateName: 'developer',
        render: () => '',
      },
    ];

    return {
      pagedItems: this.view.pagedItems,
      totalFilteredResults: this.view.totalFilteredResults,
      totalPages: this.view.totalPages,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      isAnyLoading: computed(() => !this.hasLoadedOnce()),
      errorsByCnsi: signal(new Map<string, unknown>()).asReadonly(),
      columns,
      getRowKey: s => s.guid,
      emptyMessage: 'There are no spaces',
      emptyFilterMessage: 'No spaces match the current filter',
      loadingMessage: 'Loading spaces…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48],
      },
      nameFilter: this.nameFilter,
      onClear: () => {
        this.nameFilter.set('');
        this.pageIndex.set(0);
      },
      viewMode: this.viewMode,
      sort: this.sort,
    };
  }

  // Surfaced for the wrapper / role-checkbox cells so they can render
  // the org-name input on CfRoleCheckboxComponent (the legacy reached
  // for orgName via APIResource<ISpace>.entity.organization.entity.name;
  // here we pull the same string from the wizard's pick).
  get orgName(): string {
    return this.rolesData.newRoles()?.name ?? '';
  }
}
