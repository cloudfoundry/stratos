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
import { toSignal } from '@angular/core/rxjs-interop';

import { ListStateStore, SignalListConfig, SignalListColumn } from '@stratosui/core';

import { SortSpec, ViewPipeline } from '../../../../../services/data-sources/view-pipeline';
import { CfUserService } from '../../../../data-services/cf-user.service';
import { CfUser, CfUserMissingRoles } from '../../../../../store/types/cf-user.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';

// Signal-native list config for the manage-users wizard "Select Users"
// step. Replaces CfSelectUsersListConfigService + CfSelectUsersDataSource
// (ngrx ListDataSource over the V2 paginated users action).
//
// Rows are unwrapped APIResource<CfUser>.entity — only `.guid` and
// `.username` are read from each row (column + selection key). The
// underlying pagination machinery still lives in CfUserService.getUsers()
// for now; this service drops the V2 list-config + data-source consumer
// from the chain, and the wizard reducer remains the unchanged downstream
// (it stores CfUser objects and downstream cf-roles.service re-resolves
// each user by guid via the same getUsers()).
//
// Tab-scoped @Injectable() (no providedIn) — provided by the wizard
// component so each session of the wizard gets a fresh selection set.
@Injectable()
export class CfSelectUsersSignalConfigService {
  private readonly cfUserService = inject(CfUserService);
  private readonly activeRoute = inject(ActiveRouteCfOrgSpace);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state = inject(ListStateStore).bind('cf-select-users', {
    viewMode: 'table',
    pageSize: [10, 12],
    pageIndex: [0, 0],
    sort: [
      { field: 'username', direction: 'asc' },
      { field: 'username', direction: 'asc' },
    ],
  });

  readonly nameFilter: WritableSignal<string> = signal('');
  readonly filter: WritableSignal<(u: CfUser) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<CfUser>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly viewMode = this.state.viewMode;

  // Selection state — set of CfUser.guid for currently-checked rows. Owned
  // by this service so the wizard step can read it directly without
  // squirrelling state into the wizard component.
  readonly selectedKeys: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());

  private readonly _allUsers: Signal<APIResource<CfUser>[] | null>;

  readonly users: Signal<CfUser[]>;
  readonly hasLoadedOnce: Signal<boolean>;

  view!: ViewPipeline<CfUser>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: CfUser) => unknown>> = signal(new Map());

  constructor() {
    this._allUsers = toSignal(this.cfUserService.getUsers(this.activeRoute.cfGuid, false), {
      initialValue: null,
    });
    this.users = computed(() => (this._allUsers() ?? []).map(r => r.entity));
    this.hasLoadedOnce = computed(() => this._allUsers() !== null);

    this.view = new ViewPipeline<CfUser>(
      this.users,
      this.filter,
      this.sort,
      this.pageSize,
      this.pageIndex,
      this._sortExtractors.asReadonly(),
    );

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const q = this.nameFilter().trim().toLowerCase();
        this.filter.set((u: CfUser) => {
          if (!q) return true;
          return (this.getUsername(u) ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  /**
   * Resolve the current set of selected CfUser objects. Used by the
   * wizard's onNext to dispatch UsersRolesSetUsers — preserves the legacy
   * dispatch contract (full CfUser objects, not just guids).
   */
  resolveSelected(): CfUser[] {
    const keys = this.selectedKeys();
    if (keys.size === 0) return [];
    return this.users().filter(u => keys.has(u.guid));
  }

  buildConfig(): SignalListConfig<CfUser> {
    const columns: SignalListColumn<CfUser>[] = [
      {
        header: '',
        key: 'select',
        kind: 'checkbox',
        render: () => '',
        widthHint: '3rem',
        checkbox: {
          selectedKeys: this.selectedKeys,
        },
      },
      {
        header: 'Username',
        key: 'username',
        kind: 'text',
        sortField: 'username',
        render: u => this.getUsername(u),
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
      getRowKey: u => u.guid,
      emptyMessage: 'There are no users',
      emptyFilterMessage: 'No users match the current filter',
      loadingMessage: 'Loading users…',
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

  private getUsername(user: CfUser): string {
    const username = user.username || user.guid;
    return this.hasMissingRoles(user.missingRoles)
      ? `${username} - Not all roles for this user are known`
      : username;
  }

  // Mirrors legacy hasMissingRoles — at space scope, all roles are known.
  // At org scope, only the space-roles can be missing; at cf scope, either.
  private hasMissingRoles(missingRoles?: CfUserMissingRoles): boolean {
    if (!missingRoles) return false;
    if (this.activeRoute.spaceGuid) return false;
    if (this.activeRoute.orgGuid) return !!missingRoles.space.length;
    return !!missingRoles.org.length || !!missingRoles.space.length;
  }
}
