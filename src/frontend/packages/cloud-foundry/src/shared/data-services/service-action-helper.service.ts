import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, pairwise } from 'rxjs/operators';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { serviceInstancesEntityType } from '../../../../cloud-foundry/src/cf-entity-types';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { RouterNav, RouterQueryParams } from '../../../../store/src/actions/router.actions';
import { EntityCatalogEntityConfig } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EntityService } from '../../../../store/src/entity-service';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { APIResource } from '../../../../store/src/types/api.types';
import { IServiceBinding } from '../../cf-api-svc.types';
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


  startEditServiceBindingStepper = (
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

    const es: EntityService = userProvided ?
      cfEntityCatalog.userProvidedService.store.getEntityService(guid, endpointGuid, {}) :
      cfEntityCatalog.serviceInstance.store.getEntityService(guid, endpointGuid);

    return es.entityObs$.pipe(
      filter(res => !!res),
      map(res => res.entityRequestInfo.updating[es.action.updatingKey]),
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
}
