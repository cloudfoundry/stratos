import { ComponentRef, Injectable, ViewContainerRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ActionState, AppState, EndpointModel, EndpointsDataService, entityCatalog, Store, stratosEntityCatalog } from '@stratosui/store';
import { combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { TailwindDialogService } from '../../../../services/tailwind-dialog.service';
import { CurrentUserPermissionsService } from '../../../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../../../core/permissions/stratos-user-permissions.checker';
import { ConnectEndpointDialogComponent } from '../../../../../features/endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import { SessionService } from '../../../../../shared/services/session.service';
import { UserProfileService } from '../../../../../core/user-profile.service';
import { SnackBarService } from '../../../../services/snackbar.service';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { createMetaCardMenuItemSeparator } from '../../../meta-card/meta-card-base/meta-card.component';
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

/**
 * Combine the result of all createVisibles functions for the given actions
 */
function combineCreateVisibles(
  customActions: IListAction<EndpointModel>[]
): (row$: Observable<EndpointModel>) => Observable<boolean> {
  const createVisiblesFns = customActions
    .map(action => action.createVisible)
    .filter(createVisible => !!createVisible);
  if (createVisiblesFns.length === 0) {
    return () => of(false);
  } else {
    return (row$: Observable<EndpointModel>) => {
      const createVisibles = createVisiblesFns.map(createVisible => createVisible(row$));
      return combineLatest(createVisibles).pipe(
        map(allRes => allRes.some(res => res))
      );
    };
  }
}

@Injectable()
export class EndpointListHelper {
  private store = inject<Store<AppState>>(Store);
  private router = inject(Router);
  private dialog = inject(TailwindDialogService);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBarService = inject(SnackBarService);
  private sessionService = inject(SessionService);
  private userProfileService = inject(UserProfileService);
  private endpointsData = inject(EndpointsDataService);


  endpointActions(includeSeparators = false): IListAction<EndpointModel>[] {
    // Add any additional actions that are per endpoint type
    const customActions = entityCatalog.getAllEndpointTypes()
      .map(endpoint => endpoint.definition.endpointListActions)
      .filter(endpointListActions => !!endpointListActions)
      .map(endpointListActions => endpointListActions(this.store, this.endpointsData))
      .reduce((res, actions) => res.concat(actions), []);

    if (includeSeparators && customActions.length) {
      // Only show the separator if we have custom actions to separate AND at least one is visible
      const createVisibleFn = combineCreateVisibles(customActions);
      customActions.splice(0, 0, {
        ...createMetaCardMenuItemSeparator(),
        createVisible: createVisibleFn
      });
    }

    return [
      {
        action: (item) => {
          const message1 = `Are you sure you want to disconnect endpoint '${item.name}'?`;
          // TODO: This only current applies to CF
          const message2 = item.local ? `This will also update your local configuration.` : '';
          const confirmation = new ConfirmationDialogConfig(
            'Disconnect Endpoint',
            `${message1}${message2 ? `<br><br>${message2}` : ''}`,
            'Disconnect',
            false
          );
          this.confirmDialog.open(confirmation, () => {
            // W36-B Wave 3: dispatch via EndpointsDataService.
            // Promise<ActionState>; the legacy pairwise dance over the
            // Observable form collapses to a single await.
            void this.handlePromiseAction(this.endpointsData.disconnect(item.guid), () => {
              this.snackBarService.show(`Disconnected endpoint '${item.name}'`);
              stratosEntityCatalog.systemInfo.api.getSystemInfo();
            });
          });
        },
        label: 'Disconnect',
        description: ``, // Description depends on console user permission
        createVisible: (row$: Observable<EndpointModel>) => combineLatest([
          this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT),
          row$
        ]).pipe(
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
            disableClose: true,
            width: '550px',
            maxWidth: '550px',
            panelClass: ['overflow-visible', 'p-6']
          });
        },
        label: 'Connect',
        description: '',
        createVisible: (row$: Observable<EndpointModel>) => {
          return combineLatest([
            this.sessionService.userEndpointsNotDisabled(),
            this.userProfileService.userProfile$,
            row$
          ]).pipe(
            map(([userEndpointsEnabled, profile, row]) => {
              if (userEndpointsEnabled && !row.creator.system && profile.userName !== row.creator.name) {
                // Disable connect for admins if the endpoint was not created by them. Otherwise this could result in an admin connecting to
                // multiple user endpoints that all have the same url.
                return false;
              } else {
                const endpoint = entityCatalog.getEndpoint(row.cnsi_type, row.sub_type);
                const ep = endpoint ? endpoint.definition : { unConnectable: false };
                return !ep.unConnectable && row.connectionStatus === 'disconnected';
              }
            })
          );
        }
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
            void this.handlePromiseAction(this.endpointsData.unregister(item.guid), () => {
              this.snackBarService.show(`Unregistered ${item.name}`);
            });
          });
        },
        label: 'Unregister',
        description: 'Remove the endpoint',
        createVisible: (row$: Observable<EndpointModel>) => {
          // I think if we end up using these often there should be specific create,
          // edit, delete style permissions in the stratos permissions checker
          return combineLatest([
            this.sessionService.userEndpointsNotDisabled(),
            this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT),
            this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ENDPOINT),
            row$
          ]).pipe(
            map(([userEndpointsEnabled, isAdmin, isEndpointAdmin, row]) => {
              if (!userEndpointsEnabled || row.creator.system) {
                return isAdmin;
              } else {
                return isEndpointAdmin || isAdmin;
              }
            })
          );
        }
      },
      {
        action: (item) => {
          const routerLink = `/endpoints/edit/${item.guid}`;
          this.router.navigate(routerLink.split('/'));
        },
        label: 'Edit endpoint',
        description: 'Edit the endpoint',
        createVisible: (row$: Observable<EndpointModel>) => {
          return combineLatest([
            this.sessionService.userEndpointsNotDisabled(),
            this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT),
            this.currentUserPermissionsService.can(StratosCurrentUserPermissions.EDIT_ENDPOINT),
            row$
          ]).pipe(
            map(([userEndpointsEnabled, isAdmin, isEndpointAdmin, row]) => {
              if (!userEndpointsEnabled || row.creator.system) {
                return isAdmin;
              } else {
                return isEndpointAdmin || isAdmin;
              }
            })
          );
        }
      },
      ...customActions
    ];
  }

  // W36-B Wave 3: Promise<ActionState> handler — replaces the legacy
  // Observable+pairwise busy-edge pattern. The new EndpointsDataService
  // returns the resolved final ActionState directly.
  private async handlePromiseAction(action: Promise<ActionState>, handleChange: () => void): Promise<void> {
    try {
      const result = await action;
      // https://github.com/SUSE/stratos/issues/29 Generic way to handle errors ('Failed to disconnect X')
      if (!result.error) {
        handleChange();
      }
    } catch (err) {
      // Promise rejection is a hard failure — service should normally
      // resolve with {error:true,message} instead of throwing, but
      // catch defensively.
      console.warn('Endpoint action failed:', err);
    }
  }

  createEndpointDetails(listDetailsComponent: any, container: ViewContainerRef):
    EndpointDetailsContainerRefs {
    const componentRef = container.createComponent<EndpointListDetailsComponent>(listDetailsComponent);
    const component = isEndpointListDetailsComponent(componentRef.instance);
    const refs = {
      componentRef,
      component,
      endpointDetails: container
    };
    if (!component) {
      console.warn(`Attempted to create a non-endpoint list details component "${listDetailsComponent}"`);
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
