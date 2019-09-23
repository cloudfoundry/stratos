import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { RouterNav, RouterQueryParams } from '../../../../store/src/actions/router.actions';
import { DeleteServiceBinding } from '../../../../store/src/actions/service-bindings.actions';
import { DeleteServiceInstance } from '../../../../store/src/actions/service-instances.actions';
import { DeleteUserProvidedInstance } from '../../../../store/src/actions/user-provided-service.actions';
import { AppState } from '../../../../store/src/app-state';
import { serviceInstancesSchemaKey } from '../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../store/src/types/api.types';
import { IServiceBinding } from '../../core/cf-api-svc.types';
import {
  SERVICE_INSTANCE_TYPES,
} from '../components/add-service-instance/add-service-instance-base-step/add-service-instance.types';
import { ConfirmationDialogConfig } from '../components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../components/confirmation-dialog.service';


@Injectable()
export class ServiceActionHelperService {

  constructor(
    private confirmDialog: ConfirmationDialogService,
    private store: Store<AppState>,

  ) { }

  detachServiceBinding = (
    serviceBindings: APIResource<IServiceBinding>[],
    serviceInstanceGuid: string,
    endpointGuid: string,
    noConfirm = false,
    userProvided = false
  ) => {

    if (serviceBindings.length > 1) {
      this.store.dispatch(new RouterNav({
        path: ['/services/', this.getRouteKey(userProvided), endpointGuid, serviceInstanceGuid, 'detach']
      }));
      return;
    }
    const action = new DeleteServiceBinding(endpointGuid, serviceBindings[0].metadata.guid, serviceInstanceGuid);
    if (!noConfirm) {
      const confirmation = new ConfirmationDialogConfig(
        'Detach Service Instance',
        'Are you sure you want to detach the application from the service?',
        'Detach',
        true
      );
      this.confirmDialog.open(confirmation, () =>
        this.store.dispatch(action)
      );
    } else {
      this.store.dispatch(action);
    }
  }

  deleteServiceInstance = (
    serviceInstanceGuid: string,
    serviceInstanceName: string,
    endpointGuid: string,
    userProvided = false
  ) => {
    const action = userProvided ? new DeleteUserProvidedInstance(endpointGuid, serviceInstanceGuid, serviceInstancesSchemaKey) :
      new DeleteServiceInstance(endpointGuid, serviceInstanceGuid);
    const confirmation = new ConfirmationDialogConfig(
      'Delete Service Instance',
      {
        textToMatch: serviceInstanceName
      },
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => this.store.dispatch(action));
  }


  editServiceBinding = (guid: string, endpointGuid: string, query: RouterQueryParams = {}, userProvided = false) =>
    this.store.dispatch(new RouterNav(
      {
        path: [
          '/services/', this.getRouteKey(userProvided), endpointGuid, guid, 'edit'
        ], query
      }
    ))

  private getRouteKey(userProvided: boolean) {
    return userProvided ? SERVICE_INSTANCE_TYPES.USER_SERVICE : SERVICE_INSTANCE_TYPES.SERVICE;
  }
}
