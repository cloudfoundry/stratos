import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CF_ENDPOINT_TYPE } from '../../../../cloud-foundry/cf-types';
import { DeleteServiceBinding } from '../../../../cloud-foundry/src/actions/service-bindings.actions';
import { DeleteServiceInstance } from '../../../../cloud-foundry/src/actions/service-instances.actions';
import { DeleteUserProvidedInstance } from '../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { serviceInstancesEntityType } from '../../../../cloud-foundry/src/cf-entity-factory';
import { IServiceBinding } from '../../../../core/src/core/cf-api-svc.types';
import { EntityCatalogueEntityConfig } from '../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { RouterNav, RouterQueryParams } from '../../../../store/src/actions/router.actions';
import { APIResource } from '../../../../store/src/types/api.types';
import {
  SERVICE_INSTANCE_TYPES,
} from '../components/add-service-instance/add-service-instance-base-step/add-service-instance.types';


@Injectable()
export class ServiceActionHelperService {

  constructor(
    private confirmDialog: ConfirmationDialogService,
    private store: Store<CFAppState>,

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
    const serviceInstancesEntityConfig: EntityCatalogueEntityConfig = {
      endpointType: CF_ENDPOINT_TYPE,
      entityType: serviceInstancesEntityType
    };
    const action = userProvided ? new DeleteUserProvidedInstance(endpointGuid, serviceInstanceGuid, serviceInstancesEntityConfig) :
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
