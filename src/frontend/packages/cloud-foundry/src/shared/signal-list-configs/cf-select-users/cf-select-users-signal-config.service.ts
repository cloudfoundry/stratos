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

import { SortSpec, ViewPipeline } from '../../../services/data-sources/view-pipeline';
import { CfUsersPagedDataService } from '../../data-services/cf-users-paged-data.service';
import { StUser } from '../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../../../features/cf/cf-page.types';

// Signal-native list config for the manage-users wizard "Select Users"
// step. Replaces CfSelectUsersListConfigService + CfSelectUsersDataSource
// (ngrx ListDataSource over the V2 paginated users action).
//
// Rows are signal-native StUser objects drained by CfUsersPagedDataService
// — only `.guid` and `.username` are read from each row (column + selection
// key). This service drops the V2 list-config + data-source consumer from
// the chain; the wizard reducer remains the unchanged downstream (it stores
// the selected user objects and downstream cf-roles.service re-resolves each
// user by guid via the same drain).
//
// Tab-scoped @Injectable() (no providedIn) — provided by the wizard
// component so each session of the wizard gets a fresh selection set.
@Injectable()
export class CfSelectUsersSignalConfigService {
  private readonly usersData = inject(CfUsersPagedDataService);
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
  readonly filter: WritableSignal<(u: StUser) => boolean> = signal(() => true);
  readonly sort = this.state.sort as WritableSignal<SortSpec<StUser>>;
  readonly pageSize = this.state.pageSize;
  readonly pageIndex = this.state.pageIndex;
  readonly viewMode = this.state.viewMode;

  // Selection state — set of StUser.guid for currently-checked rows. Owned
  // by this service so the wizard step can read it directly without
  // squirrelling state into the wizard component.
  readonly selectedKeys: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());

  private readonly _allUsers: Signal<StUser[] | null>;

  readonly users: Signal<StUser[]>;
  readonly hasLoadedOnce: Signal<boolean>;

  view!: ViewPipeline<StUser>;

  private readonly _sortExtractors: WritableSignal<Map<string, (row: StUser) => unknown>> = signal(new Map());

  constructor() {
    this._allUsers = toSignal(this.usersData.getUsers(this.activeRoute.cfGuid), {
      initialValue: null,
    });
    this.users = computed(() => this._allUsers() ?? []);
    this.hasLoadedOnce = computed(() => this._allUsers() !== null);

    this.view = new ViewPipeline<StUser>(
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
        this.filter.set((u: StUser) => {
          if (!q) return true;
          return (this.getUsername(u) ?? '').toLowerCase().includes(q);
        });
      });
    });
  }

  /**
   * Resolve the current set of selected StUser objects. Used by the
   * wizard's onNext to seed CfUsersRolesDataService.setUsers — full StUser
   * objects, not just guids.
   */
  resolveSelected(): StUser[] {
    const keys = this.selectedKeys();
    if (keys.size === 0) return [];
    return this.users().filter(u => keys.has(u.guid));
  }

  buildConfig(): SignalListConfig<StUser> {
    const columns: SignalListColumn<StUser>[] = [
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

  private getUsername(user: StUser): string {
    // StUser carries the full drained role set — the legacy "missing roles"
    // suffix (a V2 maxed-pagination artifact) no longer applies.
    return user.username || user.guid;
  }
}
