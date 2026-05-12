import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  ListSubNavComponent,
  SignalListComponent,
  SignalListConfig,
} from '@stratosui/core';

import { CfUsersSignalConfigService } from '../../../../../shared/components/list/list-types/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import type { StUser, StUserOrgRole, StUserSpaceRole } from '../../../../../services/endpoint-data/stratos-types';

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
// Manage Roles + Remove User flows stay on the legacy stepper paths
// (/users/manage, /users/remove) — same scope contract as the CF-level
// page commit. The legacy page-sub-nav "Manage Roles" button is dropped
// here for parity with the CF-level + per-space signal-native pages;
// future work can reintroduce it as a SignalListConfig.headerActions
// binding when the framework slot lands.
@Component({
  selector: 'app-cloud-foundry-organization-users',
  templateUrl: './cloud-foundry-organization-users.component.html',
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

  public listConfig: WritableSignal<SignalListConfig<StUser> | undefined> = signal(undefined);

  /** Reactive count for the L5 sub-nav. Wired in the constructor — the
   *  underlying `usersConfig.view` is built by initializeForOrg() and
   *  isn't available at field-initializer time. */
  readonly totalUsers!: Signal<number>;

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const orgGuid = this.cfOrgService.orgGuid;
    this.usersConfig.initializeForOrg(cfGuid, orgGuid);
    (this as { totalUsers: Signal<number> }).totalUsers = this.usersConfig.view.totalFilteredResults;

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

    // The L5 sub-nav row above this list shows "Total Users: N" with no
    // add affordance — Manage Roles and Invite User stay on the legacy
    // stepper paths (/users/manage, /users/invite). When those flows
    // migrate signal-native, wire an `addAction` onto the L5 row in the
    // template instead of reintroducing in-toolbar buttons.

    this.listConfig.set({
      pagedItems: this.usersConfig.view.pagedItems,
      totalFilteredResults: this.usersConfig.view.totalFilteredResults,
      totalPages: this.usersConfig.view.totalPages,
      pageIndex: this.usersConfig.pageIndex,
      pageSize: this.usersConfig.pageSize,
      isAnyLoading: computed(() => !this.usersConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
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
