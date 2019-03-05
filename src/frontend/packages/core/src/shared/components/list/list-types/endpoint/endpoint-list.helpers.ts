import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map, pairwise } from 'rxjs/operators';

import { DisconnectEndpoint, UnregisterEndpoint } from '../../../../../../../store/src/actions/endpoint.actions';
import { ShowSnackBar } from '../../../../../../../store/src/actions/snackBar.actions';
import { GetSystemInfo } from '../../../../../../../store/src/actions/system.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { EndpointsEffect } from '../../../../../../../store/src/effects/endpoint.effects';
import { selectDeletionInfo, selectUpdateInfo } from '../../../../../../../store/src/selectors/api.selectors';
import { EndpointModel, endpointStoreNames } from '../../../../../../../store/src/types/endpoint.types';
import { CurrentUserPermissions } from '../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import {
  ConnectEndpointDialogComponent,
} from '../../../../../features/endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { IListAction } from '../../list.component.types';

@Injectable()
export class EndpointListHelper {

  constructor(
    private store: Store<AppState>,
    private dialog: MatDialog,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private confirmDialog: ConfirmationDialogService) {

  }

  endpointActions(): IListAction<EndpointModel>[] {
    return [
      {
        action: (item) => {
          const confirmation = new ConfirmationDialogConfig(
            'Unregister Endpoint',
            `Are you sure you want to unregister endpoint '${item.name}'?`,
            'Unregister',
            true
          );
          this.confirmDialog.open(confirmation, () => {
            this.store.dispatch(new UnregisterEndpoint(item.guid, item.cnsi_type));
            this.handleDeleteAction(item, ([oldVal, newVal]) => {
              this.store.dispatch(new ShowSnackBar(`Unregistered ${item.name}`));
            });
          });
        },
        label: 'Unregister',
        description: 'Remove the endpoint',
        createVisible: () => this.currentUserPermissionsService.can(CurrentUserPermissions.ENDPOINT_REGISTER)
      },
      {
        action: (item) => {
          const confirmation = new ConfirmationDialogConfig(
            'Disconnect Endpoint',
            `Are you sure you want to disconnect endpoint '${item.name}'?`,
            'Disconnect',
            false
          );
          this.confirmDialog.open(confirmation, () => {
            this.store.dispatch(new DisconnectEndpoint(item.guid, item.cnsi_type));
            this.handleUpdateAction(item, EndpointsEffect.disconnectingKey, ([oldVal, newVal]) => {
              this.store.dispatch(new ShowSnackBar(`Disconnected endpoint '${item.name}'`));
              this.store.dispatch(new GetSystemInfo());
            });
          });
        },
        label: 'Disconnect',
        description: ``, // Description depends on console user permission
        createVisible: (row$: Observable<EndpointModel>) => combineLatest(
          this.currentUserPermissionsService.can(CurrentUserPermissions.ENDPOINT_REGISTER),
          row$
        ).pipe(
          map(([isAdmin, row]) => {
            const isConnected = row.connectionStatus === 'connected';
            return isConnected && (!row.system_shared_token || row.system_shared_token && isAdmin);
          })
        )
      },
      {
        action: (item) => {
          this.dialog.open(ConnectEndpointDialogComponent, {
            data: {
              name: item.name,
              guid: item.guid,
              type: item.cnsi_type,
              ssoAllowed: item.sso_allowed
            },
            disableClose: true
          });
        },
        label: 'Connect',
        description: '',
        createVisible: (row$: Observable<EndpointModel>) => row$.pipe(map(row => row.connectionStatus === 'disconnected'))
      }
    ];
  }

  private handleUpdateAction(item, effectKey, handleChange) {
    this.handleAction(selectUpdateInfo(
      endpointStoreNames.type,
      item.guid,
      effectKey,
    ), handleChange);
  }

  private handleDeleteAction(item, handleChange) {
    this.handleAction(selectDeletionInfo(
      endpointStoreNames.type,
      item.guid,
    ), handleChange);
  }

  private handleAction(storeSelect, handleChange) {
    const disSub = this.store.select(storeSelect).pipe(
      pairwise())
      .subscribe(([oldVal, newVal]) => {
        // https://github.com/SUSE/stratos/issues/29 Generic way to handle errors ('Failed to disconnect X')
        if (!newVal.error && (oldVal.busy && !newVal.busy)) {
          handleChange([oldVal, newVal]);
          disSub.unsubscribe();
        }
      });
  }
}
