import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, pairwise } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../cf-types';
import {
  DeleteUserProvidedInstance,
  UpdateUserProvidedServiceInstance,
} from '../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import {
  serviceBindingEntityType,
  serviceInstancesEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../cloud-foundry/src/cf-entity-types';
import { IServiceBinding, IServiceInstance, IUserProvidedServiceInstance } from '../../../../core/src/core/cf-api-svc.types';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata, EntityCatalogEntityConfig } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { RouterNav, RouterQueryParams } from '../../../../store/src/actions/router.actions';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { UpdateServiceInstance } from '../../actions/service-instances.actions';
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
    private entityServiceFactory: EntityServiceFactory
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


  editServiceBinding = (
    guid: string,
    endpointGuid: string,
    query: RouterQueryParams = {},
    userProvided = false): Observable<ActionState> => {
    this.store.dispatch(new RouterNav(
      {
        path: [
          '/services/', this.getRouteKey(userProvided), endpointGuid, guid, 'edit'
        ], query
      }
    ));

    const obs: Observable<EntityInfo<APIResource>> = userProvided ?
      this.createUserProvidedServiceInstanceObs(guid, endpointGuid) :
      this.createServiceInstanceObs(guid, endpointGuid);

    const updatingKey = userProvided ?
      UpdateUserProvidedServiceInstance.updateServiceInstance :
      UpdateServiceInstance.updateServiceInstance;

    return obs.pipe(
      filter(res => !!res),
      map(res => res.entityRequestInfo.updating[updatingKey]),
      filter(res => !!res),
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV),
      first()
    );
  }

  private getRouteKey(userProvided: boolean) {
    return userProvided ? SERVICE_INSTANCE_TYPES.USER_SERVICE : SERVICE_INSTANCE_TYPES.SERVICE;
  }

  private createUserProvidedServiceInstanceObs(guid: string, endpointGuid: string):
    Observable<EntityInfo<APIResource<IUserProvidedServiceInstance>>> {
    const serviceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, userProvidedServiceInstanceEntityType);
    const actionBuilder = serviceEntity.actionOrchestrator.getActionBuilder('get');
    const getUserProvidedServiceAction = actionBuilder(guid, endpointGuid);
    return this.entityServiceFactory.create<APIResource<IUserProvidedServiceInstance>>(
      guid,
      getUserProvidedServiceAction
    ).entityObs$;
  }

  private createServiceInstanceObs(guid: string, endpointGuid: string): Observable<EntityInfo<APIResource<IServiceInstance>>> {
    const serviceInstanceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceInstancesEntityType);
    const actionBuilder = serviceInstanceEntity.actionOrchestrator.getActionBuilder('get');
    const getServiceInstanceAction = actionBuilder(guid, endpointGuid);
    return this.entityServiceFactory.create<APIResource<IServiceInstance>>(
      guid,
      getServiceInstanceAction
    ).entityObs$;
  }
}
