import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { EndpointModel, entityCatalog } from '@stratosui/store';

import { ConfirmationDialogConfig } from '../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { SignalListRowAction } from '../../shared/components/signal-list/signal-list.component';
import { EndpointAuthStateService } from '../../shared/services/endpoint-auth-state.service';
import { TailwindDialogService } from '../../shared/services/tailwind-dialog.service';
import { TailwindSnackBarService } from '../../shared/services/tailwind-snackbar.service';
import { ConnectEndpointDialogComponent } from './connect-endpoint-dialog/connect-endpoint-dialog.component';
import { EndpointsSignalConfigService } from './endpoints-page/endpoints-signal-config.service';

/**
 * True when an endpoint's stored token is expired or effectively dead —
 * either the store computed `'expired'` from wire data at hydration (Task 3
 * of the token-lifecycle work), or the auth interceptor witnessed a 401 for
 * this guid THIS session (`EndpointAuthStateService.stale`) before the next
 * info refetch reflects the server-side disposal. Exported here (rather than
 * duplicated) so the endpoints-list status pill
 * (`EndpointsSignalListComponent`) and this service's action gate can never
 * disagree about what "expired" means. Lives in this file rather than the
 * store package because it needs no store-only knowledge beyond
 * `EndpointModel`, and core components already import from this service
 * file - no new dependency edge, no cycle.
 */
export function isEndpointExpired(ep: EndpointModel, staleGuids: ReadonlySet<string>): boolean {
  return ep.connectionStatus === 'expired' ||
    (ep.connectionStatus === 'connected' && !!ep.guid && staleGuids.has(ep.guid));
}

/**
 * Per-endpoint kebab actions (Connect / Disconnect / Edit / Unregister) with
 * their dialog and snackbar flows. Shared by the /endpoints signal list and
 * the /cloud-foundry endpoint picker so both surfaces offer the same
 * endpoint management menu.
 *
 * Decisions deliberately mirror the legacy EndpointListHelper: visibility
 * tied to connectionStatus + endpoint type capability flags, with destructive
 * Unregister flagged danger so it stands apart visually. The legacy
 * permission-aware visibility checks (Edit / Unregister hidden behind
 * EDIT_ADMIN_ENDPOINT etc.) are intentionally NOT ported here for the first
 * cut - the surrounding permission model needs its own pass during the
 * endpoint subpages migration.
 */
@Injectable({ providedIn: 'root' })
export class EndpointRowActionsService {
  private router = inject(Router);
  private endpointsConfig = inject(EndpointsSignalConfigService);
  private confirmDialog = inject(ConfirmationDialogService);
  private tailwindDialog = inject(TailwindDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private authState = inject(EndpointAuthStateService);

  /**
   * `unregister: false` for surfaces that project endpoints without managing
   * their registration (the /cloud-foundry picker) - registering and
   * unregistering are admin-level operations on the global registration and
   * stay on the Endpoints page.
   */
  buildEndpointActions = (ep: EndpointModel, opts: { unregister?: boolean } = {}): readonly SignalListRowAction<EndpointModel>[] => {
    // 'expired' rows (and 'connected' rows the interceptor has marked stale
    // this session) still hold a stored token - Disconnect must stay
    // available, and they get the same Reconnect entry a healthy connected
    // endpoint does, so the two states share the isConnected branch below.
    const isConnected = ep.connectionStatus === 'connected' || isEndpointExpired(ep, this.authState.stale());
    const isDisconnected = ep.connectionStatus === 'disconnected';
    const def = entityCatalog.getEndpoint(ep.cnsi_type ?? '', ep.sub_type);
    const connectable = !(def?.definition?.unConnectable);

    const out: SignalListRowAction<EndpointModel>[] = [];

    if (isConnected) {
      out.push({
        // `link_off` is Material Symbols only - under the classic
        // Material Icons font shipped here it fails to compose as a
        // ligature, widening the kebab cell. `power_settings_new`
        // composes correctly and conveys disconnect.
        label: 'Disconnect', icon: 'power_settings_new',
        invoke: () => this.openDisconnectConfirm(ep),
      });
      out.push({
        // Re-auth in place: opens the connect dialog against the already
        // connected endpoint so a fresh token replaces the current one -
        // no manual disconnect step. Same flow the stale-token snackbar's
        // Reconnect action uses.
        label: 'Reconnect', icon: 'refresh',
        invoke: () => this.openConnectDialog(ep),
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
      invoke: () => { this.router.navigate(`/endpoints/edit/${ep.guid}`.split('/')); },
    });

    if (opts.unregister !== false) {
      out.push({
        label: 'Unregister', icon: 'delete', danger: true,
        invoke: () => this.openUnregisterConfirm(ep),
      });
    }

    return out;
  };

  private openConnectDialog(ep: EndpointModel): void {
    // Same data shape the legacy endpoint-list helper uses - keeps the dialog
    // contract identical so the unchanged ConnectEndpointDialogComponent reads
    // the same input fields it always has.
    this.tailwindDialog.open(ConnectEndpointDialogComponent, {
      data: {
        name: ep.name,
        guid: ep.guid,
        type: ep.cnsi_type,
        subType: ep.sub_type,
        ssoAllowed: ep.sso_allowed,
        // Prefills the Reconnect dialog with the live connection's user
        username: ep.user?.name,
      },
      disableClose: true,
      width: '550px',
      maxWidth: '550px',
      panelClass: ['overflow-visible', 'p-6'],
    });
  }

  private openDisconnectConfirm(ep: EndpointModel): void {
    const { guid, cnsi_type } = ep;
    if (!guid || !cnsi_type) {
      return;
    }
    const message1 = `Are you sure you want to disconnect endpoint '${ep.name}'?`;
    const message2 = ep.local ? `This will also update your local configuration.` : '';
    const config = new ConfirmationDialogConfig(
      'Disconnect Endpoint',
      `${message1}${message2 ? `<br><br>${message2}` : ''}`,
      'Disconnect',
      false,
    );
    this.confirmDialog.open(config, () => {
      void this.handleAction(this.endpointsConfig.disconnectEndpoint(guid, cnsi_type), () => {
        this.snackBar.show(`Disconnected endpoint '${ep.name}'`);
      });
    });
  }

  private openUnregisterConfirm(ep: EndpointModel): void {
    const { guid, cnsi_type } = ep;
    if (!guid || !cnsi_type) {
      return;
    }
    const config = new ConfirmationDialogConfig(
      'Unregister Endpoint',
      `Are you sure you want to unregister endpoint '${ep.name}'?`,
      'Unregister',
      true,
    );
    this.confirmDialog.open(config, () => {
      void this.handleAction(this.endpointsConfig.unregisterEndpoint(guid, cnsi_type), () => {
        this.snackBar.show(`Unregistered ${ep.name}`);
      });
    });
  }

  // W36-B Wave 3: EndpointsDataService returns a single resolved
  // ActionState via Promise - no more pairwise() over a busy-idle
  // legacy ngrx Observable. Success/failure routes off the resolved
  // state directly.
  private async handleAction(action: Promise<{ error: boolean; message?: string }>, onSuccess: () => void): Promise<void> {
    try {
      const result = await action;
      if (!result.error) {
        onSuccess();
      } else {
        this.snackBar.show(result.message ?? 'Action failed');
      }
    } catch (err) {
      this.snackBar.show((err as Error)?.message ?? 'Action failed');
    }
  }
}
