import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, pairwise } from 'rxjs/operators';

import { UpdateUserProvidedServiceInstance } from '../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { serviceInstancesEntityType } from '../../../../cloud-foundry/src/cf-entity-types';
import { IServiceBinding, IServiceInstance, IUserProvidedServiceInstance } from '../../../../core/src/core/cf-api-svc.types';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { RouterNav, RouterQueryParams } from '../../../../store/src/actions/router.actions';
import { EntityCatalogEntityConfig } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { APIResource, EntityInfo } from '../../../../store/src/types/api.types';
import { UpdateServiceInstance } from '../../actions/service-instances.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
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

    const action = cfEntityCatalog.serviceBinding.actions.remove(serviceBindings[0].metadata.guid, endpointGuid, { serviceInstanceGuid });
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
      cfEntityCatalog.userProvidedService.actions.remove(serviceInstanceGuid, endpointGuid, serviceInstancesEntityConfig) :
      cfEntityCatalog.serviceInstance.actions.remove(serviceInstanceGuid, endpointGuid);

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
    return cfEntityCatalog.userProvidedService.store.getEntityService(guid, endpointGuid, {}).entityObs$;
  }

  private createServiceInstanceObs(guid: string, endpointGuid: string): Observable<EntityInfo<APIResource<IServiceInstance>>> {
    return cfEntityCatalog.serviceInstance.store.getEntityService(guid, endpointGuid).entityObs$;
  }
}
