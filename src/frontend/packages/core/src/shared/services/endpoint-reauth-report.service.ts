import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EndpointsDataService } from '@stratosui/store';

import { ConnectEndpointConfig } from '../../features/endpoints/connect.service';
import { CONNECT_ENDPOINT_DIALOG_OPTIONS, ConnectEndpointDialogComponent } from '../../features/endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import { TailwindDialogService } from './tailwind-dialog.service';
import { TailwindSnackBarService } from './tailwind-snackbar.service';

/**
 * Arrival report: once per session, after the endpoints list first hydrates,
 * tell the user which of their connected endpoints already need
 * re-authentication - before any page trips over a dead one. Detection is
 * wire data only (computed 'expired' status, Task 3 of the token-lifecycle
 * work); no probing.
 */
@Injectable({ providedIn: 'root' })
export class EndpointReauthReportService {
  private endpointsData = inject(EndpointsDataService);
  private snackbar = inject(TailwindSnackBarService);
  private dialog = inject(TailwindDialogService);
  private router = inject(Router);
  private reported = false;

  async reportOnce(): Promise<void> {
    if (this.reported) {
      return;
    }
    this.reported = true;
    await this.endpointsData.whenReady();
    const dead = this.endpointsData.endpointsList().filter(ep => ep.connectionStatus === 'expired');
    if (dead.length === 0) {
      return;
    }
    if (dead.length === 1) {
      const ep = dead[0];
      const ref = this.snackbar.error(`Endpoint '${ep.name}' needs re-authentication.`, 'Reconnect');
      ref.onAction().subscribe(() => {
        // Same data shape EndpointRowActionsService.openConnectDialog uses -
        // including the username prefill (#5634) - so the Reconnect dialog
        // reads identically regardless of which surface opened it.
        const data: ConnectEndpointConfig = {
          name: ep.name,
          guid: ep.guid ?? '',
          type: ep.cnsi_type ?? 'cf',
          subType: ep.sub_type ?? '',
          ssoAllowed: ep.sso_allowed,
          username: ep.user?.name,
        };
        this.dialog.open(ConnectEndpointDialogComponent, {
          data,
          ...CONNECT_ENDPOINT_DIALOG_OPTIONS,
        });
      });
    } else {
      const ref = this.snackbar.error(`${dead.length} endpoints need re-authentication.`, 'View');
      ref.onAction().subscribe(() => this.router.navigate(['/endpoints']));
    }
  }
}
