import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CF_ENDPOINT_TYPE } from '../../../../cloud-foundry/cf-types';
import { DeleteUserProvidedInstance } from '../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { serviceBindingEntityType, serviceInstancesEntityType } from '../../../../cloud-foundry/src/cf-entity-types';
import { IServiceBinding } from '../../../../core/src/core/cf-api-svc.types';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog.service';
import {
  EntityCatalogEntityConfig,
  IEntityMetadata,
} from '../../../../store/src/entity-catalog/entity-catalog.types';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { RouterNav, RouterQueryParams } from '../../../../store/src/actions/router.actions';
import { APIResource } from '../../../../store/src/types/api.types';
import { ServiceBindingActionBuilders } from '../../entity-action-builders/service-binding.action-builders';
import { ServiceInstanceActionBuilders } from '../../entity-action-builders/service-instance.action.builders';
import {
  SERVICE_INSTANCE_TYPES,
} from '../components/add-service-instance/add-service-instance-base-step/add-service-instance.types';


@Injectable()
export class ServiceActionHelperService {

  private sgEntity = entityCatalog.getEntity<IEntityMetadata, any, ServiceBindingActionBuilders>(
    CF_ENDPOINT_TYPE,
    serviceBindingEntityType
  );

  private serviceInstanceEntity = entityCatalog.getEntity<IEntityMetadata, any, ServiceInstanceActionBuilders>(
    CF_ENDPOINT_TYPE,
    serviceInstancesEntityType
  );

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

    const actionBuilder = this.sgEntity.actionOrchestrator.getActionBuilder('remove');
    const action = actionBuilder(serviceBindings[0].metadata.guid, endpointGuid, { serviceInstanceGuid });
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
    const serviceInstancesEntityConfig: EntityCatalogEntityConfig = {
      endpointType: CF_ENDPOINT_TYPE,
      entityType: serviceInstancesEntityType
    };

    const action = userProvided ?
      new DeleteUserProvidedInstance(endpointGuid, serviceInstanceGuid, serviceInstancesEntityConfig) :
      this.serviceInstanceEntity.actionOrchestrator.getActionBuilder('remove')(serviceInstanceGuid, endpointGuid);

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
