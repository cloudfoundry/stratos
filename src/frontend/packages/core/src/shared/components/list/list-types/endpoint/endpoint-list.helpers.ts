import { ComponentFactoryResolver, ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map, pairwise } from 'rxjs/operators';

import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog';
import { ActionState } from '../../../../../../../store/src/reducers/api-request-reducer/types';
import { stratosEntityCatalog } from '../../../../../../../store/src/stratos-entity-catalog';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { LoggerService } from '../../../../../core/logger.service';
import { CurrentUserPermissionsService } from '../../../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../../../core/permissions/stratos-user-permissions.checker';
import {
  ConnectEndpointDialogComponent,
} from '../../../../../features/endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import { SnackBarService } from '../../../../services/snackbar.service';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { IListAction } from '../../list.component.types';
import { TableCellCustom } from '../../list.types';

interface EndpointDetailsContainerRefs {
  componentRef: ComponentRef<EndpointListDetailsComponent>;
  component: EndpointListDetailsComponent;
  endpointDetails: ViewContainerRef;
}

export abstract class EndpointListDetailsComponent extends TableCellCustom<EndpointModel> {
  isEndpointListDetailsComponent = true;
  isTable = true;
}

function isEndpointListDetailsComponent(obj: any): EndpointListDetailsComponent {
  return obj ? obj.isEndpointListDetailsComponent ? obj as EndpointListDetailsComponent : null : null;
}

@Injectable()
export class EndpointListHelper {
  constructor(
    private store: Store<AppState>,
    private dialog: MatDialog,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private confirmDialog: ConfirmationDialogService,
    private log: LoggerService,
    private snackBarService: SnackBarService,
  ) { }

  endpointActions(): IListAction<EndpointModel>[] {
    return [
      {
        action: (item) => {
          const confirmation = new ConfirmationDialogConfig(
            'Disconnect Endpoint',
            `Are you sure you want to disconnect endpoint '${item.name}'?`,
            'Disconnect',
            false
          );
          this.confirmDialog.open(confirmation, () => {
            const obs$ = stratosEntityCatalog.endpoint.api.disconnect<ActionState>(item.guid, item.cnsi_type);
            this.handleAction(obs$, () => {
              this.snackBarService.show(`Disconnected endpoint '${item.name}'`);
              stratosEntityCatalog.systemInfo.api.getSystemInfo();
            });
          });
        },
        label: 'Disconnect',
        description: ``, // Description depends on console user permission
        createVisible: (row$: Observable<EndpointModel>) => combineLatest(
          this.currentUserPermissionsService.can(StratosCurrentUserPermissions.ENDPOINT_REGISTER),
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
              subType: item.sub_type,
              ssoAllowed: item.sso_allowed
            },
            disableClose: true
          });
        },
        label: 'Connect',
        description: '',
        createVisible: (row$: Observable<EndpointModel>) => row$.pipe(map(row => {
          const endpoint = entityCatalog.getEndpoint(row.cnsi_type, row.sub_type);
          const ep = endpoint ? endpoint.definition : { unConnectable: false };
          return !ep.unConnectable && row.connectionStatus === 'disconnected';
        }))
      },
      {
        action: (item) => {
          const confirmation = new ConfirmationDialogConfig(
            'Unregister Endpoint',
            `Are you sure you want to unregister endpoint '${item.name}'?`,
            'Unregister',
            true
          );
          this.confirmDialog.open(confirmation, () => {
            const obs$ = stratosEntityCatalog.endpoint.api.unregister<ActionState>(item.guid, item.cnsi_type);
            this.handleAction(obs$, () => {
              this.snackBarService.show(`Unregistered ${item.name}`);
            });
          });
        },
        label: 'Unregister',
        description: 'Remove the endpoint',
        createVisible: () => this.currentUserPermissionsService.can(StratosCurrentUserPermissions.ENDPOINT_REGISTER)
      },
      {
        action: (item) => {
          const routerLink = `/endpoints/edit/${item.guid}`;
          this.store.dispatch(new RouterNav({ path: routerLink }));
        },
        label: 'Edit endpoint',
        description: 'Edit the endpoint',
        createVisible: () => this.currentUserPermissionsService.can(StratosCurrentUserPermissions.ENDPOINT_REGISTER)
      }
    ];
  }

  private handleAction(obs$: Observable<ActionState>, handleChange: ([o, n]: [ActionState, ActionState]) => void) {
    const disSub = obs$.pipe(
      pairwise()
    ).subscribe(([oldVal, newVal]) => {
      // https://github.com/SUSE/stratos/issues/29 Generic way to handle errors ('Failed to disconnect X')
      if (!newVal.error && (oldVal.busy && !newVal.busy)) {
        handleChange([oldVal, newVal]);
        disSub.unsubscribe();
      }
    });
  }

  createEndpointDetails(listDetailsComponent: any, container: ViewContainerRef, componentFactoryResolver: ComponentFactoryResolver):
    EndpointDetailsContainerRefs {
    const componentFactory = componentFactoryResolver.resolveComponentFactory<EndpointListDetailsComponent>(listDetailsComponent);
    const componentRef = container.createComponent<EndpointListDetailsComponent>(componentFactory);
    const component = isEndpointListDetailsComponent(componentRef.instance);
    const refs = {
      componentRef,
      component,
      endpointDetails: container
    };
    if (!component) {
      this.log.warn(`Attempted to create a non-endpoint list details component "${listDetailsComponent}"`);
      this.destroyEndpointDetails(refs);
    }
    return refs;
  }

  destroyEndpointDetails(refs: EndpointDetailsContainerRefs) {
    if (refs.componentRef && refs.componentRef.destroy) {
      refs.componentRef.destroy();
    }
    if (refs.endpointDetails && refs.endpointDetails.clear) {
      refs.endpointDetails.clear();
    }
  }
}
