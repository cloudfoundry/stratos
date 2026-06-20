import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { combineLatest, map } from 'rxjs';

import {
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  ListSubNavAction,
  ListSubNavComponent,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  TailwindDialogService,
  TailwindSnackBarService,
} from '@stratosui/core';

import { CfUsersSignalConfigService } from '../../../../../shared/signal-list-configs/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions.types';
import type { StUser, StUserOrgRole, StUserSpaceRole } from '../../../../../services/endpoint-data/stratos-types';
import {
  bulkRemoveUsers,
  selectedHasAnyRole,
  RemoveScope,
  BulkRemoveDeps,
} from '../../../../../shared/signal-list-configs/user/cf-users-bulk-remove';
import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import { UserInviteService } from '../../../user-invites/user-invite.service';
import { AddUserDialogComponent } from '../../../users/add-user/add-user-dialog.component';

// Signal-native replacement for the legacy CloudFoundryOrganizationUsers
// component. Scoped to one org under one CF endpoint. Reuses the CF-level
// page's CfUsersSignalConfigService via initializeForOrg, which pins the
// lockedOrgGuid so the user list narrows to users with at least one role
// (org or space) in the target org.
//
// Columns trim the CF-level shape:
// - Org Roles column shows only THIS org's role bucket (filtered from the
//   full orgRoles[] array — usually exactly one bucket per row).
// - Space Roles column shows only roles under spaces owned by THIS org
//   (filtered on StUserSpaceRole.orgGuid). Space names render via the
//   shared name-lookup signals (no_raw_guids feedback rule).
// - Username, Origin, Created retained.
//
// Action bar (always-visible, "Total Users" line):
// - Manage Roles (primary): opens org-scoped manage wizard for selected users.
// - Remove from Org and Spaces (destructive): bulk-removes all org+space role
//   grants for selected users within this org; gated on canManageRoles +
//   selectedHasAnyRole(selected, orgGuid).
// Per-row kebab retired; both operations are now selection-driven.
@Component({
  selector: 'app-cloud-foundry-organization-users',
  templateUrl: './cloud-foundry-organization-users.component.html',
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
export class CloudFoundryOrganizationUsersComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  private usersConfig = inject(CfUsersSignalConfigService);
  private router = inject(Router);
  private readonly perms = inject(CurrentUserPermissionsService);
  private readonly rolesData = inject(CfUsersRolesDataService);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(TailwindSnackBarService);
  private readonly dialog = inject(TailwindDialogService);
  private readonly userInviteService = inject(UserInviteService);

  public listConfig: WritableSignal<SignalListConfig<StUser> | undefined> = signal(undefined);

  // Bulk-selection state for the checkbox column. Holds the set of selected
  // row keys (`${cnsiGuid}:${guid}`, per getRowKey). The "Manage Roles"
  // subNavAction reads this, resolves keys → user GUIDs, and navigates to
  // the org-scoped manage-users wizard with ?users=g1,g2,… then clears.
  private readonly _selectedUserKeys: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());
  readonly selectedUserKeys: Signal<ReadonlySet<string>> = this._selectedUserKeys.asReadonly();

  /** Reactive count for the L5 sub-nav. Wired in the constructor — the
   *  underlying `usersConfig.view` is built by initializeForOrg() and
   *  isn't available at field-initializer time. */
  readonly totalUsers!: Signal<number>;

  /** True when the current user holds org or space role-change rights on
   *  this endpoint. Bridged from Observable → signal via toSignal;
   *  initialValue: false keeps actions safely disabled until first emission. */
  private readonly canManageRoles: Signal<boolean> = toSignal(
    combineLatest([
      this.perms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, this.cfEndpointService.cfGuid),
      this.perms.can(CfCurrentUserPermissions.SPACE_CHANGE_ROLES, this.cfEndpointService.cfGuid),
    ]).pipe(map(([org, space]) => org || space)),
    { initialValue: false },
  );

  /** True when the CF endpoint has the UAA invite feature configured. */
  private readonly userInviteAllowed: Signal<boolean> = toSignal(
    this.userInviteService.configured$,
    { initialValue: false },
  );

  /** The concrete StUser objects for the current selection, resolved from
   *  filteredItems by row key. Used by Remove to pass actual role data to
   *  the bulk-remove orchestrator without re-fetching. */
  private readonly selectedUsers: Signal<StUser[]> = computed(() => {
    const keys = this._selectedUserKeys();
    if (keys.size === 0) return [];
    return this.usersConfig.view.filteredItems().filter(u => keys.has(`${u.cnsiGuid}:${u.guid}`));
  });

  private readonly cfGuid: string;
  private readonly orgGuid: string;

  /** Action buttons surfaced in the always-visible ListSubNavComponent
   *  "Total Users" bar. Prepended Add User + Manage Roles (primary) +
   *  Remove from Org and Spaces (destructive). */
  protected readonly subNavActions: readonly ListSubNavAction[] = [
    {
      label: 'Add User',
      icon: 'person_add',
      variant: 'default',
      dataTest: 'cf-users-add',
      visible: computed(() => this.canManageRoles()),
      disabled: computed(() => !this.canManageRoles()),
      invoke: () => this.openAddUser(),
    },
    {
      label: 'Manage Roles',
      variant: 'primary',
      icon: 'group',
      dataTest: 'cf-org-users-bulk-manage-roles',
      disabled: computed(() => this._selectedUserKeys().size === 0 || !this.canManageRoles()),
      disabledReason: 'Select one or more users to manage roles',
      invoke: () => this.bulkManageRoles(
        this._selectedUserKeys(),
        ['/cloud-foundry', this.cfGuid, 'organizations', this.orgGuid, 'users', 'manage'],
      ),
    },
    {
      label: 'Remove from Org and Spaces',
      variant: 'destructive',
      icon: 'remove_circle',
      dataTest: 'cf-org-users-bulk-remove-org-spaces',
      disabled: computed(() => !this.canManageRoles() || !selectedHasAnyRole(this.selectedUsers(), this.orgGuid)),
      disabledReason: 'Select one or more users with roles to remove',
      invoke: () => {
        const n = this.selectedUsers().length;
        this.bulkRemove(
          `Remove ${n} selected ${n === 1 ? 'user' : 'users'} from all their org and space roles in this org? This cannot be undone.`,
        );
      },
    },
  ];

  /** Reactive selection count for the sub-nav "N selected · Clear" indicator. */
  protected readonly selectedCount: Signal<number> = computed(() => this._selectedUserKeys().size);

  /** Clears the user selection — bound to the sub-nav Clear button. */
  protected readonly clearSelection = (): void => { this._selectedUserKeys.set(new Set<string>()); };

  /** Opens the Add User dialog locked to this org (no org picker shown). */
  protected openAddUser(): void {
    const orgName = this.cfOrgService.orgDataService.org()?.name;
    this.dialog.open(AddUserDialogComponent, {
      data: {
        cfGuid: this.cfGuid,
        orgGuid: this.orgGuid,
        orgName,
        userInviteAllowed: this.userInviteAllowed(),
      },
      width: '640px',
    });
  }

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const orgGuid = this.cfOrgService.orgGuid;
    this.cfGuid = cfGuid;
    this.orgGuid = orgGuid;
    this.usersConfig.initializeForOrg(cfGuid, orgGuid);
    (this as { totalUsers: Signal<number> }).totalUsers = this.usersConfig.view.totalItems;

    const renderUsername = (u: StUser): string =>
      u.username && u.username.length > 0 ? u.username : (u.presentationName ?? u.guid);

    const renderOrigin = (u: StUser): string =>
      u.origin && u.origin.length > 0 ? u.origin : '—';

    // Filter the user's orgRoles[] down to grants in THIS org and join the
    // (already prefix-stripped) role names. In practice each user has
    // exactly one bucket per org, but the .filter handles duplicates
    // gracefully.
    const renderOrgRoles = (u: StUser): string => {
      const roles = (u.orgRoles ?? [])
        .filter((or: StUserOrgRole) => or.orgGuid === orgGuid)
        .flatMap(or => or.roles ?? []);
      return roles.length === 0 ? '—' : roles.join(', ');
    };

    // Space roles narrowed to spaces owned by THIS org. Each segment shows
    // "<space>: <roles>" — the org context is implicit (we're on the org
    // page). Falls back to a short-form GUID if the space name lookup
    // hasn't resolved yet (typical race-free flow: EndpointDataService
    // loadDetails populates orgs+spaces before the user fetch completes).
    const renderSpaceRoles = (u: StUser): string => {
      const buckets = (u.spaceRoles ?? [])
        .filter((sr: StUserSpaceRole) => sr.orgGuid === orgGuid);
      if (buckets.length === 0) return '—';
      return buckets
        .map(sr => `${this.spaceLabel(sr)}: ${(sr.roles ?? []).join(', ')}`)
        .join('  •  ');
    };

    const renderCreated = (u: StUser): string =>
      CloudFoundryOrganizationUsersComponent.formatDate(u.createdAt);

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
          kind: 'text',
          render: renderOrgRoles,
          widthHint: '16rem',
        },
        {
          header: 'Space Roles', key: 'spaceRoles', sortField: renderSpaceRoles,
          kind: 'text',
          render: renderSpaceRoles,
          widthHint: '20rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: renderCreated,
          widthHint: '12rem',
        },
      ],
      getRowKey: (u: StUser) => `${u.cnsiGuid}:${u.guid}`,
      emptyMessage: 'There are no users in this organization',
      emptyFilterMessage: 'No users match the current filters',
      loadingMessage: 'Loading users…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.usersConfig.nameFilter,
      onRefresh: () => this.usersConfig.refresh(),
      onClear: () => this.usersConfig.clearFilters(),
      viewMode: this.usersConfig.viewMode,
      sort: this.usersConfig.sort,
    });

    this.usersConfig.registerSortExtractor('origin', renderOrigin);
    this.usersConfig.registerSortExtractor('orgRoles', renderOrgRoles);
    this.usersConfig.registerSortExtractor('spaceRoles', renderSpaceRoles);
  }

  // Leading checkbox column for bulk selection. selectAll selects every
  // FILTERED row (across pages, not just the current page) when not all are
  // already selected, else clears.
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

  private toggleSelectAllFiltered(): void {
    const filtered = this.usersConfig.view.filteredItems();
    const allKeys = filtered.map(u => `${u.cnsiGuid}:${u.guid}`);
    const current = this._selectedUserKeys();
    const allSelected = allKeys.length > 0 && allKeys.every(k => current.has(k));
    this._selectedUserKeys.set(allSelected ? new Set<string>() : new Set(allKeys));
  }

  // Bulk Manage Roles: resolve selected row keys (`${cnsiGuid}:${guid}`) to
  // user GUIDs and navigate to the org-scoped manage-users wizard with
  // ?users=g1,g2,… (the wizard parses the list itself — no ngrx dispatch).
  private bulkManageRoles(keys: ReadonlySet<string>, manageUrl: readonly string[]): void {
    const guids = Array.from(keys).map(k => k.split(':')[1]).filter(Boolean);
    if (guids.length === 0) return;
    void this.router.navigate([...manageUrl], { queryParams: { users: guids.join(',') } });
    this._selectedUserKeys.set(new Set<string>());
  }

  private removeDeps(): BulkRemoveDeps {
    return {
      rolesData: this.rolesData,
      userPerms: this.perms,
      confirmDialog: this.confirmDialog,
      snackBar: this.snackBar,
      cfGuid: this.cfGuid,
    };
  }

  private async bulkRemove(message: string): Promise<void> {
    await bulkRemoveUsers(this.removeDeps(), {
      users: this.selectedUsers(),
      opts: {
        scope: 'orgAndSpaces' as RemoveScope,
        orgGuid: this.orgGuid,
        orgNameByGuid: this.usersConfig.orgNameByGuid(),
        spaceNameByGuid: this.usersConfig.spaceNameByGuid(),
      },
      title: 'Remove from Org and Spaces',
      message,
      onComplete: () => this._selectedUserKeys.set(new Set<string>()),
    });
  }

  // Resolves a space-role bucket's display label. Used by the plain-text
  // render path. Falls back to the short-form GUID if the name lookup
  // hasn't resolved yet (no_raw_guids rule — never render a full GUID).
  private spaceLabel(r: StUserSpaceRole): string {
    return this.usersConfig.spaceNameByGuid().get(r.spaceGuid) ?? this.shortGuid(r.spaceGuid);
  }

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
