import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { combineLatest, map } from 'rxjs';

import {
  CurrentUserPermissionsService,
  ListSubNavComponent,
  SignalListBulkAction,
  SignalListCompoundSegment,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListDropdown,
  SignalListHeaderAction,
  SignalListRowAction,
} from '@stratosui/core';

import { CfUsersSignalConfigService } from '../../../../shared/signal-list-configs/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions.types';
import type { StUser, StUserOrgRole, StUserSpaceRole } from '../../../../services/endpoint-data/stratos-types';

// Signal-native replacement for the legacy CloudFoundryUsersComponent at
// /cloud-foundry/:cnsi/users. CNSI-wide — shows every user the CF returns,
// joined with their org and space role grants by the backend handler.
//
// Manage Roles + Remove User wizards are still legacy ngrx (separate
// route entries under /cloud-foundry/:cnsi/users/manage|remove); per-row
// kebab entries here just navigate to those routes with ?user={guid}
// pre-filling the wizard. The Org Roles + Space Roles columns resolve
// org/space names via EndpointDataService signals so cells never render
// raw GUIDs (no_raw_guids feedback rule).
@Component({
  selector: 'app-cloud-foundry-users',
  templateUrl: './cloud-foundry-users.component.html',
  host: { class: 'app-host-fill' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ListSubNavComponent,
    SignalListComponent,
  ],
})
export class CloudFoundryUsersComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private usersConfig = inject(CfUsersSignalConfigService);
  private router = inject(Router);
  private readonly perms = inject(CurrentUserPermissionsService);

  public listConfig: WritableSignal<SignalListConfig<StUser> | undefined> = signal(undefined);

  // Bulk-selection state for the checkbox column. Holds the set of selected
  // row keys (`${cnsiGuid}:${guid}`, per getRowKey). The "Manage Roles" bulk
  // action reads this, resolves keys → user GUIDs, and navigates to the
  // manage-users wizard with ?users=g1,g2,… then clears the set.
  private readonly _selectedUserKeys: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());
  readonly selectedUserKeys: Signal<ReadonlySet<string>> = this._selectedUserKeys.asReadonly();

  /** Reactive count for the L5 sub-nav. Wired in the constructor — the
   *  underlying `usersConfig.view` is built by initialize() and isn't
   *  available at field-initializer time. */
  readonly totalUsers!: Signal<number>;

  /** True when the current user holds org or space role-change rights on
   *  this endpoint. Admin satisfies both checks; non-admin must have the
   *  specific permission in at least one org or space. Bridges the
   *  Observable from CurrentUserPermissionsService into a signal via
   *  toSignal; initialValue: false keeps the action safely disabled until
   *  the first emission resolves. */
  private readonly canManageRoles!: Signal<boolean>;

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.usersConfig.initialize(cfGuid);
    (this as { totalUsers: Signal<number> }).totalUsers = this.usersConfig.view.totalItems;
    (this as { canManageRoles: Signal<boolean> }).canManageRoles = toSignal(
      combineLatest([
        this.perms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, cfGuid),
        this.perms.can(CfCurrentUserPermissions.SPACE_CHANGE_ROLES, cfGuid),
      ]).pipe(map(([org, space]) => org || space)),
      { initialValue: false },
    );

    // Cell renderers. Each role-bucket cell resolves org/space names via
    // the config service's lookup signals (which read EndpointDataService
    // orgs() / spaces() — populated by the home-page parallelization
    // cache as a side-effect of loadDetails()). Empty buckets render '—'
    // to match the legacy "no roles" presentation.
    const renderUsername = (u: StUser): string =>
      u.username && u.username.length > 0 ? u.username : (u.presentationName ?? u.guid);

    const renderOrigin = (u: StUser): string =>
      u.origin && u.origin.length > 0 ? u.origin : '—';

    const renderOrgRoles = (u: StUser): string => {
      const roles = u.orgRoles ?? [];
      if (roles.length === 0) return '—';
      return roles.map(r => `${this.orgLabel(r)}: ${(r.roles ?? []).join(', ')}`).join('  •  ');
    };

    const compoundOrgRoles = (u: StUser): SignalListCompoundSegment[] => {
      const roles = u.orgRoles ?? [];
      if (roles.length === 0) return [{ text: '—' }];
      const out: SignalListCompoundSegment[] = [];
      for (const r of roles) {
        const orgName = this.usersConfig.orgNameByGuid().get(r.orgGuid);
        const labelText = `${orgName ?? this.shortGuid(r.orgGuid)}: ${(r.roles ?? []).join(', ')}`;
        if (orgName) {
          out.push({
            text: labelText,
            link: ['/cloud-foundry', u.cnsiGuid, 'organizations', r.orgGuid],
          });
        } else {
          out.push({ text: labelText });
        }
      }
      return out;
    };

    const renderSpaceRoles = (u: StUser): string => {
      const roles = u.spaceRoles ?? [];
      if (roles.length === 0) return '—';
      return roles.map(r => `${this.spaceLabel(r)}: ${(r.roles ?? []).join(', ')}`).join('  •  ');
    };

    const compoundSpaceRoles = (u: StUser): SignalListCompoundSegment[] => {
      const roles = u.spaceRoles ?? [];
      if (roles.length === 0) return [{ text: '—' }];
      const out: SignalListCompoundSegment[] = [];
      for (const r of roles) {
        const spaceName = this.usersConfig.spaceNameByGuid().get(r.spaceGuid);
        const orgName = r.orgGuid ? this.usersConfig.orgNameByGuid().get(r.orgGuid) : undefined;
        const display = spaceName
          ? (orgName ? `${orgName} / ${spaceName}` : spaceName)
          : this.shortGuid(r.spaceGuid);
        const labelText = `${display}: ${(r.roles ?? []).join(', ')}`;
        if (spaceName && r.orgGuid) {
          out.push({
            text: labelText,
            link: ['/cloud-foundry', u.cnsiGuid, 'organizations', r.orgGuid, 'spaces', r.spaceGuid],
          });
        } else {
          out.push({ text: labelText });
        }
      }
      return out;
    };

    const renderCreated = (u: StUser): string =>
      CloudFoundryUsersComponent.formatDate(u.createdAt);

    // Page-level actions reintroduced via SignalList headerActions slot.
    // Both Invite User and Manage Users currently route to the legacy
    // stepper components — when they migrate signal-native we keep these
    // entries pointed at whatever the new home is. Surface as header
    // buttons rather than per-row actions because they operate on the
    // CF as a whole, not on individual user rows.
    const headerActions: SignalListHeaderAction[] = [
      {
        label: 'Invite User',
        icon: 'mail_outline',
        title: 'Invite a new user to this Cloud Foundry',
        dataTest: 'cf-users-invite-user',
        run: (): void => {
          void this.router.navigate(
            ['/cloud-foundry', cfGuid, 'users', 'invite'],
          );
        },
      },
      {
        label: 'Manage Users',
        icon: 'group',
        title: 'Manage org / space role assignments',
        dataTest: 'cf-users-manage-users',
        primary: true,
        run: (): void => {
          void this.router.navigate(
            ['/cloud-foundry', cfGuid, 'users', 'manage'],
          );
        },
      },
    ];

    this.listConfig.set({
      pagedItems: this.usersConfig.view.pagedItems,
      totalFilteredResults: this.usersConfig.view.totalFilteredResults,
      totalPages: this.usersConfig.view.totalPages,
      pageIndex: this.usersConfig.pageIndex,
      pageSize: this.usersConfig.pageSize,
      isAnyLoading: computed(() => !this.usersConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        this.buildSelectColumn(),
        {
          header: 'Username', key: 'username', sortField: 'username',
          kind: 'text',
          render: renderUsername,
          widthHint: '16rem',
        },
        {
          header: 'Origin', key: 'origin', sortField: renderOrigin,
          kind: 'text',
          render: renderOrigin,
          widthHint: '8rem',
        },
        {
          header: 'Org Roles', key: 'orgRoles', sortField: renderOrgRoles,
          kind: 'compound',
          compound: compoundOrgRoles,
          render: renderOrgRoles,
          widthHint: '20rem',
          // Cap visible org-role segments. A handful of orgs is the
          // common case; the cap protects the row height from operators
          // that hold roles in dozens of orgs (admin accounts on busy
          // CFs). Click "…and N more orgs" to expand.
          maxVisible: 5,
          collapsedLabel: (n: number) => `…and ${n} more orgs`,
        },
        {
          header: 'Space Roles', key: 'spaceRoles', sortField: renderSpaceRoles,
          kind: 'compound',
          compound: compoundSpaceRoles,
          render: renderSpaceRoles,
          widthHint: '22rem',
          // Cap visible space-role segments. The motivating case: admin
          // user with 2507 space role grants overflowed the row visually
          // and pushed the Username out of viewport (see
          // project_signallist_row_overflow.md). 5 keeps typical operator
          // rows compact and gives a clear "…and N more spaces" link to
          // see the rest.
          maxVisible: 5,
          collapsedLabel: (n: number) => `…and ${n} more spaces`,
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: renderCreated,
          widthHint: '12rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: (u: StUser) => this.buildRowActions(u, cfGuid),
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (u: StUser) => `${u.cnsiGuid}:${u.guid}`,
      emptyMessage: 'There are no users in this Cloud Foundry',
      emptyFilterMessage: 'No users match the current filters',
      loadingMessage: 'Loading users…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.usersConfig.nameFilter,
      filterDropdowns: [
        {
          label: 'Organization',
          options: this.usersConfig.orgOptions,
          selected: this.usersConfig.selectedOrg,
          loading: this.usersConfig.isLoadingOrgs,
        },
        {
          label: 'Space',
          options: this.usersConfig.spaceOptions,
          selected: this.usersConfig.selectedSpace,
          loading: this.usersConfig.isLoadingSpaces,
        },
      ] as SignalListDropdown[],
      onRefresh: () => this.usersConfig.refresh(),
      onClear: () => this.usersConfig.clearFilters(),
      viewMode: this.usersConfig.viewMode,
      sort: this.usersConfig.sort,
      headerActions,
      bulkActions: [
        {
          label: 'Manage Roles', icon: 'group',
          dataTest: 'cf-users-bulk-manage-roles',
          disabled: computed(() => this.selectedUserKeys().size === 0 || !this.canManageRoles()),
          run: (keys) => this.bulkManageRoles(keys, ['/cloud-foundry', cfGuid, 'users', 'manage']),
        },
      ] as SignalListBulkAction<StUser>[],
    });

    this.usersConfig.registerSortExtractor('origin', renderOrigin);
    this.usersConfig.registerSortExtractor('orgRoles', renderOrgRoles);
    this.usersConfig.registerSortExtractor('spaceRoles', renderSpaceRoles);
  }

  // Leading checkbox column for bulk selection. selectAll selects every
  // FILTERED row (across pages, not just the current page) when not all are
  // already selected, else clears — mirroring the legacy
  // dataSource.selectAllFilteredRows() affordance.
  private buildSelectColumn(): SignalListColumn<StUser> {
    return {
      header: '', key: 'select', kind: 'checkbox',
      render: () => '',
      widthHint: '3rem',
      checkbox: {
        selectedKeys: this._selectedUserKeys,
        selectAll: {
          selectableCount: () => this.usersConfig.view.totalFilteredResults(),
          onToggle: () => this.toggleSelectAllFiltered(),
        },
      },
    };
  }

  // Select-all-filtered toggle: if every filtered row is already selected,
  // clear; otherwise add all filtered rows' keys to the selection.
  private toggleSelectAllFiltered(): void {
    const filtered = this.usersConfig.view.filteredItems();
    const allKeys = filtered.map(u => `${u.cnsiGuid}:${u.guid}`);
    const current = this._selectedUserKeys();
    const allSelected = allKeys.length > 0 && allKeys.every(k => current.has(k));
    this._selectedUserKeys.set(allSelected ? new Set<string>() : new Set(allKeys));
  }

  // Bulk Manage Roles: resolve selected row keys (`${cnsiGuid}:${guid}`) to
  // user GUIDs and navigate to the manage-users wizard with ?users=g1,g2,…
  // (the wizard parses the comma-separated list itself — no ngrx dispatch).
  // Clears the selection afterward so the bar collapses on return.
  private bulkManageRoles(keys: ReadonlySet<string>, manageUrl: readonly string[]): void {
    const guids = Array.from(keys).map(k => k.split(':')[1]).filter(Boolean);
    if (guids.length === 0) return;
    void this.router.navigate([...manageUrl], { queryParams: { users: guids.join(',') } });
    this._selectedUserKeys.set(new Set<string>());
  }

  // Per-row Manage Roles + Remove (2 variants) kebab entries. Restores
  // the V2-era manageUserAction + removeUserActions() singles that the
  // signal-native migration dropped (catalog 2026-05-26 CF-scope row).
  // Each entry navigates to the existing legacy wizard route with the
  // user GUID forwarded via ?user= so the wizard pre-selects this row.
  // "Remove from Spaces" sets ?spaces=true to scope the wizard to
  // space-role grants only; without the param the wizard strips org +
  // space roles together. Both variants ship today as separate kebab
  // items rather than a sub-menu since SignalListRowAction is flat.
  private buildRowActions(u: StUser, cfGuid: string): readonly SignalListRowAction<StUser>[] {
    return [
      {
        label: 'Manage Roles', icon: 'group',
        invoke: () => {
          void this.router.navigate(
            ['/cloud-foundry', cfGuid, 'users', 'manage'],
            { queryParams: { user: u.guid } },
          );
        },
      },
      {
        label: 'Remove from Spaces', icon: 'remove_circle_outline',
        invoke: () => {
          void this.router.navigate(
            ['/cloud-foundry', cfGuid, 'users', 'remove'],
            { queryParams: { user: u.guid, spaces: 'true' } },
          );
        },
      },
      {
        label: 'Remove from Org and Spaces', icon: 'remove_circle', danger: true,
        invoke: () => {
          void this.router.navigate(
            ['/cloud-foundry', cfGuid, 'users', 'remove'],
            { queryParams: { user: u.guid } },
          );
        },
      },
    ];
  }

  // Resolves an org-role bucket's display label. Used by the plain-text
  // render path (sort + accessibility) — the compound path does its own
  // segment composition with link wiring.
  private orgLabel(r: StUserOrgRole): string {
    return this.usersConfig.orgNameByGuid().get(r.orgGuid) ?? this.shortGuid(r.orgGuid);
  }

  private spaceLabel(r: StUserSpaceRole): string {
    const spaceName = this.usersConfig.spaceNameByGuid().get(r.spaceGuid);
    if (!spaceName) return this.shortGuid(r.spaceGuid);
    const orgName = r.orgGuid ? this.usersConfig.orgNameByGuid().get(r.orgGuid) : undefined;
    return orgName ? `${orgName} / ${spaceName}` : spaceName;
  }

  // GUID short-form for the rare case where a role references an org/space
  // we haven't yet resolved a name for. Eight-char prefix is enough to
  // disambiguate; full GUIDs in cells violate the no_raw_guids rule.
  private shortGuid(guid: string): string {
    if (!guid) return '—';
    return guid.length > 8 ? `${guid.slice(0, 8)}…` : guid;
  }

  static formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }
}
