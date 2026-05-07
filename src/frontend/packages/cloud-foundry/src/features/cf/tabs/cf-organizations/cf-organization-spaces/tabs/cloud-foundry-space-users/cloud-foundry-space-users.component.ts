import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  ListSubNavComponent,
  SignalListComponent,
  SignalListConfig,
} from '@stratosui/core';

import { CfUsersSignalConfigService } from '../../../../../../../shared/components/list/list-types/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import type { StUser, StUserSpaceRole } from '../../../../../../../services/endpoint-data/stratos-types';

// Signal-native replacement for the legacy CloudFoundrySpaceUsersComponent.
// Scoped to one space under one org under one CF endpoint. Reuses the
// CF-level page's CfUsersSignalConfigService via initializeForSpace, which
// pins the lockedSpaceGuid so the user list narrows to users with at least
// one role in the target space.
//
// Columns trim the CF-level shape:
// - No Org Roles column (the page is space-scoped — every visible user
//   already holds a role in this org by definition).
// - Space Roles column shows only THIS space's roles (filtered from the
//   full spaceRoles[] bucket).
// - Username, Origin, Created retained.
//
// Manage Roles + Remove User flows stay on the legacy stepper paths
// (/users/manage, /users/remove) — same scope contract as the CF-level
// page commit. The legacy page-sub-nav "Manage Roles" button is dropped
// here for parity with the CF-level signal-native page; future work can
// reintroduce it as a SignalListConfig.headerActions binding.
@Component({
  selector: 'app-cloud-foundry-space-users',
  templateUrl: './cloud-foundry-space-users.component.html',
  styleUrls: ['./cloud-foundry-space-users.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ListSubNavComponent,
    SignalListComponent,
  ],
})
export class CloudFoundrySpaceUsersComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  cfSpaceService = inject(CloudFoundrySpaceService);
  private usersConfig = inject(CfUsersSignalConfigService);

  public listConfig: WritableSignal<SignalListConfig<StUser> | undefined> = signal(undefined);

  /** Reactive count for the L5 sub-nav. Wired in the constructor — the
   *  underlying `usersConfig.view` is built by initializeForSpace() and
   *  isn't available at field-initializer time. */
  readonly totalUsers!: Signal<number>;

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const spaceGuid = this.cfSpaceService.spaceGuid;
    this.usersConfig.initializeForSpace(cfGuid, spaceGuid);
    (this as { totalUsers: Signal<number> }).totalUsers = this.usersConfig.view.totalFilteredResults;

    const renderUsername = (u: StUser): string =>
      u.username && u.username.length > 0 ? u.username : (u.presentationName ?? u.guid);

    const renderOrigin = (u: StUser): string =>
      u.origin && u.origin.length > 0 ? u.origin : '—';

    // Filter the user's spaceRoles[] down to grants in THIS space, then
    // join the (already prefix-stripped) role names. Page is scoped, so
    // there's only ever one matching bucket per row in practice — but the
    // .filter handles the edge case of duplicate role grants gracefully.
    const renderSpaceRoles = (u: StUser): string => {
      const roles = (u.spaceRoles ?? [])
        .filter((sr: StUserSpaceRole) => sr.spaceGuid === spaceGuid)
        .flatMap(sr => sr.roles ?? []);
      return roles.length === 0 ? '—' : roles.join(', ');
    };

    const renderCreated = (u: StUser): string =>
      CloudFoundrySpaceUsersComponent.formatDate(u.createdAt);

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
      isAnyLoading: signal(false),
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
          header: 'Space Roles', key: 'spaceRoles', sortField: renderSpaceRoles,
          kind: 'text',
          render: renderSpaceRoles,
          widthHint: '18rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: renderCreated,
          widthHint: '12rem',
        },
      ],
      getRowKey: (u: StUser) => `${u.cnsiGuid}:${u.guid}`,
      emptyMessage: 'There are no users in this space',
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
    this.usersConfig.registerSortExtractor('spaceRoles', renderSpaceRoles);
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
