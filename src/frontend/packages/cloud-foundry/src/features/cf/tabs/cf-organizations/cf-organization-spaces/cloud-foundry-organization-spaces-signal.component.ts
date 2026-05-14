import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListComponent,
  SignalListConfig,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';
import {
  UserFavorite,
  UserFavoriteManager,
} from '@stratosui/store';

import { CfSpacesSignalConfigService } from '../../../../../shared/components/list/list-types/space/cf-spaces-signal-config.service';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';
import type { StSpace } from '../../../../../services/endpoint-data/stratos-types';

// Signal-native replacement for CloudFoundryOrganizationSpacesComponent.
// Scoped to one org under one CF endpoint (both guids supplied by the
// route-level services). Uses EndpointDataService's already-loaded
// spaces + apps signals, so no new Jetstream reads are needed — the
// home-page parallelization work populates both.
@Component({
  selector: 'app-cloud-foundry-organization-spaces-signal',
  templateUrl: './cloud-foundry-organization-spaces-signal.component.html',
  styleUrls: ['./cloud-foundry-organization-spaces-signal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ListSubNavComponent,
    SignalListComponent,
  ],
})
export class CloudFoundryOrganizationSpacesSignalComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  private spacesConfig = inject(CfSpacesSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);

  // Favorite keys in rowKey format (${cnsi}:${spaceGuid}). Reads spaces
  // + orgs favorites from the manager and projects to the row-key set
  // the SignalListColumn.favorite binding expects.
  private readonly favoriteSpaceRowKeys: Signal<ReadonlySet<string>> = toSignal(
    this.userFavoriteManager.getAllFavorites().pipe(
      map(([groups, entities]) => {
        const out = new Set<string>();
        if (!groups || !entities) return out;
        for (const epFavGuid in groups) {
          const g = groups[epFavGuid];
          if (!g?.entitiesIds) continue;
          for (const favId of g.entitiesIds) {
            const fav = entities[favId];
            if (fav && fav.entityType === 'space' && fav.endpointType === 'cf') {
              out.add(`${fav.endpointId}:${fav.entityId}`);
            }
          }
        }
        return out;
      }),
    ),
    { initialValue: new Set<string>() },
  );

  public listConfig: WritableSignal<SignalListConfig<StSpace> | undefined> = signal(undefined);

  /** Total space count for the L5 sub-nav. Assigned in the constructor
   *  once spacesConfig.initialize() has populated `view`. */
  public totalSpaces!: Signal<number>;

  /** Primary action shown on the L5 sub-nav — navigates to the
   *  add-space stepper for the org currently in scope. */
  public createSpaceAction!: ListSubNavAddAction;

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const orgGuid = this.cfOrgService.orgGuid;
    const router = inject(Router);
    this.spacesConfig.initialize(cfGuid, orgGuid);
    (this as { totalSpaces: Signal<number> }).totalSpaces =
      this.spacesConfig.view.totalFilteredResults;
    this.createSpaceAction = {
      label: 'Create Space',
      icon: 'add',
      invoke: () => router.navigate([
        '/cloud-foundry', cfGuid, 'organizations', orgGuid, 'add-space',
      ]),
    };

    // appCount is enriched server-side by getNativeOrgSpaces (one
    // /v3/apps batch on space_guids) so the Apps column reads it
    // directly off the row instead of joining a per-CNSI app cache.
    const renderApps = (space: StSpace): string => {
      if (!this.spacesConfig.hasLoadedOnce()) return '—';
      return String(space.appCount ?? 0);
    };

    this.listConfig.set({
      pagedItems: this.spacesConfig.view.pagedItems,
      totalFilteredResults: this.spacesConfig.view.totalFilteredResults,
      totalPages: this.spacesConfig.view.totalPages,
      pageIndex: this.spacesConfig.pageIndex,
      pageSize: this.spacesConfig.pageSize,
      isAnyLoading: computed(() => !this.spacesConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'link',
          link: (s: StSpace) => ['/cloud-foundry', cfGuid, 'organizations', orgGuid, 'spaces', s.guid],
          render: (s: StSpace) => s.name,
          widthHint: '20rem',
        },
        {
          header: 'Applications', key: 'apps', sortField: renderApps,
          render: renderApps,
          widthHint: '8rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (s: StSpace) => CloudFoundryOrganizationSpacesSignalComponent.formatDate(s.createdAt),
          widthHint: '12rem',
        },
        {
          header: '', key: 'favorite',
          kind: 'favorite',
          favorite: {
            keys: this.favoriteSpaceRowKeys,
            toggle: (s: StSpace) => this.toggleSpaceFavorite(s),
          },
          render: () => '',
          widthHint: '3rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: this.buildSpaceActions,
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (s: StSpace) => `${s.cnsiGuid}:${s.guid}`,
      emptyMessage: 'There are no spaces in this organization',
      emptyFilterMessage: 'No spaces match the current filters',
      loadingMessage: 'Loading spaces…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.spacesConfig.nameFilter,
      onRefresh: () => this.spacesConfig.refresh(),
      onClear: () => this.spacesConfig.clearFilters(),
      viewMode: this.spacesConfig.viewMode,
      sort: this.spacesConfig.sort,
    });

    this.spacesConfig.registerSortExtractor('apps', (s: StSpace) => s.appCount ?? 0);
  }

  private toggleSpaceFavorite(space: StSpace): void {
    const fav = new UserFavorite(space.cnsiGuid, 'cf', 'space', space.guid);
    this.userFavoriteManager.toggleFavorite(fav);
  }

  private buildSpaceActions = (space: StSpace): readonly SignalListRowAction<StSpace>[] => {
    const runAction = async (label: string, op: () => Promise<void>) => {
      try {
        await op();
      } catch (err: any) {
        this.snackBar.error(`${label} failed: ${err?.message ?? err}`);
      }
    };
    return [
      {
        label: 'Delete', icon: 'delete', danger: true,
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Delete Space',
            `Are you sure you want to delete "${space.name}"? This cannot be undone and will remove all apps, routes, and services within it.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            await runAction('Delete', () => this.spacesConfig.deleteSpace(space.cnsiGuid, space.guid));
          });
        },
      },
    ];
  };

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
