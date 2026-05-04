import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Signal, WritableSignal, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { map, pairwise } from 'rxjs/operators';

import {
  AppState,
  EndpointModel,
  RouterNav,
  UserFavorite,
  UserFavoriteManager,
  entityCatalog,
  getFullEndpointApiUrl,
  stratosEntityCatalog,
} from '@stratosui/store';

import { ConfirmationDialogConfig } from '../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import {
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListPillColor,
  SignalListRowAction,
} from '../../../shared/components/signal-list/signal-list.component';
import { SnackBarService } from '../../../shared/services/snackbar.service';
import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
import { ConnectEndpointDialogComponent } from '../connect-endpoint-dialog/connect-endpoint-dialog.component';
import { EndpointsSignalConfigService } from './endpoints-signal-config.service';

// Signal-native replacement for the inner <app-list> on /endpoints. Reuses
// SignalListComponent + the column-kind vocabulary already exercised by the
// app wall / orgs / spaces / routes pages so /endpoints adopts the same look
// and feel. Only the inner list swaps — the surrounding EndpointsPageComponent
// keeps its register modal, snackbar, health-check pulse, no-endpoints custom
// hook, and backup/restore button (all rxjs-based and out of scope).
@Component({
  selector: 'app-endpoints-signal-list',
  templateUrl: './endpoints-signal-list.component.html',
  styleUrls: ['./endpoints-signal-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SignalListComponent],
})
export class EndpointsSignalListComponent {
  private store = inject<Store<AppState>>(Store);
  private endpointsConfig = inject(EndpointsSignalConfigService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private confirmDialog = inject(ConfirmationDialogService);
  private tailwindDialog = inject(TailwindDialogService);
  private snackBar = inject(SnackBarService);

  // Endpoint favorites in rowKey format. Endpoints are top-level (no parent
  // CNSI), so both the favorite endpointId and entityId are the endpoint guid
  // itself; the rowKey reduces to `${guid}:${guid}`. Filter by entityType =
  // 'endpoint' so other favorite types (apps / orgs / spaces / routes) don't
  // pollute the set.
  // Endpoint favorites live at the group level: the favorites store keys groups
  // by endpoint guid, with an `endpoint` UserFavorite slot and an `ethereal`
  // flag that's true when the group was auto-created (i.e. a child app/org/etc
  // was favorited but the endpoint itself wasn't). A non-ethereal group means
  // the endpoint was explicitly starred. We only care about that group-level
  // record here — the entitiesIds list is for child favorites the app wall /
  // orgs / etc. lists already track separately.
  private readonly favoriteEndpointRowKeys: Signal<ReadonlySet<string>> = toSignal(
    this.userFavoriteManager.getAllFavorites().pipe(
      map(([groups]) => {
        const out = new Set<string>();
        if (!groups) return out;
        for (const epFavGuid in groups) {
          const g = groups[epFavGuid];
          if (!g || g.ethereal) continue;
          const ep = g.endpoint;
          // Endpoint favorites have entityId omitted on the way in (see
          // `toggleEndpointFavorite`), so we synthesize the row key from
          // endpointId twice to match the table's getRowKey shape
          // (`${ep.guid}:${ep.guid}`).
          if (ep && ep.entityType === 'endpoint' && ep.endpointId) {
            out.add(`${ep.endpointId}:${ep.endpointId}`);
          }
        }
        return out;
      }),
    ),
    { initialValue: new Set<string>() },
  );

  public listConfig: WritableSignal<SignalListConfig<EndpointModel> | undefined> = signal(undefined);

  constructor() {
    this.endpointsConfig.initialize();

    const typeLabel = (ep: EndpointModel): string => {
      const def = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
      return def?.definition?.label ?? ep.cnsi_type ?? '';
    };

    const addressOf = (ep: EndpointModel): string => {
      try {
        return getFullEndpointApiUrl(ep) ?? '';
      } catch {
        return ep.api_endpoint?.Host ?? '';
      }
    };

    const adminLabel = (ep: EndpointModel): string => {
      // Surface the creator name only when the creator is admin — matches the
      // legacy 'Creator' column behaviour, which reads creator.name. The em-dash
      // placeholder lines up with how other signal-list pages render absent
      // values, keeping the column scannable.
      return ep.creator?.admin ? ep.creator.name : '—';
    };

    const userLabel = (ep: EndpointModel): string => ep.user?.name ?? '';

    const statusLabel = (ep: EndpointModel): string => {
      const s = ep.connectionStatus ?? 'unknown';
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const statusColor = (ep: EndpointModel): SignalListPillColor => {
      const s = ep.connectionStatus;
      if (s === 'connected') return 'success';
      if (s === 'checking') return 'warning';
      // disconnected / unknown / undefined all collapse to neutral.
      return 'neutral';
    };

    this.listConfig.set({
      pagedItems: this.endpointsConfig.view.pagedItems,
      totalFilteredResults: this.endpointsConfig.view.totalFilteredResults,
      totalPages: this.endpointsConfig.view.totalPages,
      pageIndex: this.endpointsConfig.pageIndex,
      pageSize: this.endpointsConfig.pageSize,
      isAnyLoading: signal(false),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Type', key: 'type', sortField: typeLabel,
          kind: 'text',
          render: typeLabel,
          widthHint: '10rem',
        },
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'text',
          render: (ep: EndpointModel) => ep.name ?? '',
          widthHint: '16rem',
        },
        {
          header: 'Address', key: 'address', sortField: addressOf,
          kind: 'text',
          render: addressOf,
          widthHint: '24rem',
        },
        {
          header: 'Admin', key: 'admin', sortField: adminLabel,
          kind: 'text',
          render: adminLabel,
          widthHint: '12rem',
        },
        {
          header: 'User', key: 'user', sortField: userLabel,
          kind: 'text',
          render: userLabel,
          widthHint: '12rem',
        },
        {
          header: 'Status', key: 'status', sortField: 'connectionStatus',
          kind: 'dot',
          pillColor: statusColor,
          render: statusLabel,
          widthHint: '8rem',
        },
        {
          header: '', key: 'favorite',
          kind: 'favorite',
          favorite: {
            keys: this.favoriteEndpointRowKeys,
            toggle: (ep: EndpointModel) => this.toggleEndpointFavorite(ep),
          },
          render: () => '',
          widthHint: '3rem',
        } as SignalListColumn<EndpointModel>,
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: this.buildEndpointActions,
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (ep: EndpointModel) => `${ep.guid}:${ep.guid}`,
      emptyMessage: 'There are no registered endpoints',
      emptyFilterMessage: 'No endpoints match the current filters',
      loadingMessage: 'Loading endpoints…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.endpointsConfig.nameFilter,
      onRefresh: () => this.endpointsConfig.refresh(),
      onClear: () => this.endpointsConfig.clearFilters(),
      cardAccentColor: statusColor,
      viewMode: this.endpointsConfig.viewMode,
      sort: this.endpointsConfig.sort,
    });

    this.endpointsConfig.registerSortExtractor('type', typeLabel);
    this.endpointsConfig.registerSortExtractor('address', addressOf);
    this.endpointsConfig.registerSortExtractor('admin', adminLabel);
    this.endpointsConfig.registerSortExtractor('user', userLabel);
  }

  private toggleEndpointFavorite(ep: EndpointModel): void {
    // Endpoints are top-level. The favorites-groups reducer determines
    // "this favorite IS the endpoint itself" via `!favorite.entityId`
    // (`user-favorites-groups.reducer.ts:135`) — so we MUST omit entityId
    // here. Passing the endpoint's guid as entityId steers the reducer
    // into the child-entity branch, which leaves `fg.endpoint` null and
    // `fg.ethereal` true; the keys signal then skips the group, the
    // star icon never updates, and the endpoint never shows up in the
    // home-page favorites tile.
    const fav = new UserFavorite(ep.guid, ep.cnsi_type, 'endpoint');
    this.userFavoriteManager.toggleFavorite(fav);
  }

  // Build the per-row kebab menu. Decisions deliberately mirror the legacy
  // EndpointListHelper: visibility tied to connectionStatus + endpoint type
  // capability flags, with destructive Unregister flagged danger so it stands
  // apart visually. The legacy permission-aware visibility checks (Edit /
  // Unregister hidden behind EDIT_ADMIN_ENDPOINT etc.) are intentionally NOT
  // ported here for the first cut — the page's existing canRegisterEndpoint
  // signal already gates the page-level Register button, and the surrounding
  // permission model needs its own pass during the endpoint subpages migration.
  // Flagging this as a deferred-parity item in the commit message.
  private buildEndpointActions = (ep: EndpointModel): readonly SignalListRowAction<EndpointModel>[] => {
    const isConnected = ep.connectionStatus === 'connected';
    const isDisconnected = ep.connectionStatus === 'disconnected';
    const def = entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type);
    const connectable = !(def?.definition?.unConnectable);

    const out: SignalListRowAction<EndpointModel>[] = [];

    if (isConnected) {
      out.push({
        label: 'Disconnect', icon: 'link_off',
        invoke: () => this.openDisconnectConfirm(ep),
      });
    } else if (connectable) {
      out.push({
        label: 'Connect', icon: 'link',
        disabled: !isDisconnected,
        invoke: () => this.openConnectDialog(ep),
      });
    }

    out.push({
      label: 'Edit', icon: 'edit',
      invoke: () => this.store.dispatch(new RouterNav({ path: `/endpoints/edit/${ep.guid}` })),
    });

    out.push({
      label: 'Unregister', icon: 'delete', danger: true,
      invoke: () => this.openUnregisterConfirm(ep),
    });

    return out;
  };

  private openConnectDialog(ep: EndpointModel): void {
    // Same data shape the legacy endpoint-list helper uses — keeps the dialog
    // contract identical so the unchanged ConnectEndpointDialogComponent reads
    // the same input fields it always has.
    this.tailwindDialog.open(ConnectEndpointDialogComponent, {
      data: {
        name: ep.name,
        guid: ep.guid,
        type: ep.cnsi_type,
        subType: ep.sub_type,
        ssoAllowed: ep.sso_allowed,
      },
      disableClose: true,
      width: '550px',
      maxWidth: '550px',
      panelClass: ['overflow-visible', 'p-6'],
    });
  }

  private openDisconnectConfirm(ep: EndpointModel): void {
    const message1 = `Are you sure you want to disconnect endpoint '${ep.name}'?`;
    const message2 = ep.local ? `This will also update your local configuration.` : '';
    const config = new ConfirmationDialogConfig(
      'Disconnect Endpoint',
      `${message1}${message2 ? `<br><br>${message2}` : ''}`,
      'Disconnect',
      false,
    );
    this.confirmDialog.open(config, () => {
      const obs$ = this.endpointsConfig.disconnectEndpoint(ep.guid, ep.cnsi_type);
      this.handleAction(obs$, () => {
        this.snackBar.show(`Disconnected endpoint '${ep.name}'`);
        // System info also needs a refresh so menu / nav items that key off
        // connection status update — same call the legacy path made.
        if (stratosEntityCatalog?.systemInfo?.api?.getSystemInfo) {
          stratosEntityCatalog.systemInfo.api.getSystemInfo();
        }
      });
    });
  }

  private openUnregisterConfirm(ep: EndpointModel): void {
    const config = new ConfirmationDialogConfig(
      'Unregister Endpoint',
      `Are you sure you want to unregister endpoint '${ep.name}'?`,
      'Unregister',
      true,
    );
    this.confirmDialog.open(config, () => {
      const obs$ = this.endpointsConfig.unregisterEndpoint(ep.guid, ep.cnsi_type);
      this.handleAction(obs$, () => {
        this.snackBar.show(`Unregistered ${ep.name}`);
      });
    });
  }

  // Pair-watch the ActionState observable for the busy → !busy transition,
  // which is how the legacy EndpointListHelper detects success / failure
  // without leaning on a side-effect from the action reducer. Local
  // subscription handle so we can unsubscribe inside the handler — the
  // observable itself never completes.
  private handleAction(obs$: any, onSuccess: () => void): void {
    const sub: Subscription = obs$.pipe(pairwise()).subscribe(([oldVal, newVal]: [any, any]) => {
      if (!newVal.error && oldVal.busy && !newVal.busy) {
        onSuccess();
        sub.unsubscribe();
      } else if (newVal.error && oldVal.busy && !newVal.busy) {
        this.snackBar.show(newVal.message ?? 'Action failed');
        sub.unsubscribe();
      }
    });
  }
}
