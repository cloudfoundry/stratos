import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, WritableSignal, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  SignalListCompoundSegment,
  SignalListComponent,
  SignalListConfig,
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
    SignalListComponent,
  ],
})
export class CloudFoundryUsersComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private usersConfig = inject(CfUsersSignalConfigService);

  public listConfig: WritableSignal<SignalListConfig<StUser> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.usersConfig.initialize(cfGuid);

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
          header: 'Org Roles', key: 'orgRoles', sortField: renderOrgRoles,
          kind: 'compound',
          compound: compoundOrgRoles,
          render: renderOrgRoles,
          widthHint: '20rem',
        },
        {
          header: 'Space Roles', key: 'spaceRoles', sortField: renderSpaceRoles,
          kind: 'compound',
          compound: compoundSpaceRoles,
          render: renderSpaceRoles,
          widthHint: '22rem',
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
