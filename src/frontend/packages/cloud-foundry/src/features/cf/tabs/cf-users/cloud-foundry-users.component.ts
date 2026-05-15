import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import {
  ListSubNavComponent,
  SignalListCompoundSegment,
  SignalListComponent,
  SignalListConfig,
  SignalListHeaderAction,
} from '@stratosui/core';

import { CfUsersSignalConfigService } from '../../../../shared/components/list/list-types/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StUser, StUserOrgRole, StUserSpaceRole } from '../../../../services/endpoint-data/stratos-types';

// Signal-native replacement for the legacy CloudFoundryUsersComponent at
// /cloud-foundry/:cnsi/users. CNSI-wide — shows every user the CF returns,
// joined with their org and space role grants by the backend handler.
//
// Manage Roles + Remove User flows stay legacy this round (separate route
// entries under /cloud-foundry/:cnsi/users/manage|remove); the page is
// read-only signal-native. The Org Roles + Space Roles columns resolve
// org/space names via EndpointDataService signals so cells never render
// raw GUIDs (no_raw_guids feedback rule).
@Component({
  selector: 'app-cloud-foundry-users',
  templateUrl: './cloud-foundry-users.component.html',
  styleUrls: ['./cloud-foundry-users.component.scss'],
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

  public listConfig: WritableSignal<SignalListConfig<StUser> | undefined> = signal(undefined);

  /** Reactive count for the L5 sub-nav. Wired in the constructor — the
   *  underlying `usersConfig.view` is built by initialize() and isn't
   *  available at field-initializer time. */
  readonly totalUsers!: Signal<number>;

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.usersConfig.initialize(cfGuid);
    (this as { totalUsers: Signal<number> }).totalUsers = this.usersConfig.view.totalFilteredResults;

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
      onRefresh: () => this.usersConfig.refresh(),
      onClear: () => this.usersConfig.clearFilters(),
      viewMode: this.usersConfig.viewMode,
      sort: this.usersConfig.sort,
      headerActions,
    });

    this.usersConfig.registerSortExtractor('origin', renderOrigin);
    this.usersConfig.registerSortExtractor('orgRoles', renderOrgRoles);
    this.usersConfig.registerSortExtractor('spaceRoles', renderSpaceRoles);
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
