import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../../cloud-foundry/cf-types';
import { FetchAllServiceBindings } from '../../../../../../cloud-foundry/src/actions/service-bindings.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { serviceEntityType } from '../../../../../../cloud-foundry/src/cf-entity-factory';
import { IServiceBinding } from '../../../../../../core/src/core/cf-api-svc.types';
import { CurrentUserPermissionsService } from '../../../../../../core/src/core/current-user-permissions.service';
import { entityCatalogue } from '../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { RowState } from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { ListViewTypes } from '../../../../../../core/src/shared/components/list/list.component.types';
import { PaginationMonitorFactory } from '../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../store/src/types/api.types';
import {
  AppServiceBindingListConfigService,
} from '../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ApplicationService } from '../../application.service';
import { QParam } from '../../../../../../store/src/q-param';

@Injectable()
export class AppDeleteServiceInstancesListConfigService extends AppServiceBindingListConfigService {
  hideRefresh: boolean;
  allowSelection: boolean;
  obsCache: { [serviceGuid: string]: Observable<RowState> } = {};

  static createFetchServiceBinding = (cfGuid: string, serviceInstanceGuid: string): FetchAllServiceBindings => {
    const action = new FetchAllServiceBindings(
      cfGuid,
      createEntityRelationPaginationKey(serviceEntityType, serviceInstanceGuid),
    );
    action.initialParams['results-per-page'] = 1;
    action.initialParams.q = [
      new QParam('service_instance_guid', serviceInstanceGuid).toString(),
    ];
    return action;
  }

  constructor(
    store: Store<CFAppState>,
    appService: ApplicationService,
    datePipe: DatePipe,
    currentUserPermissionService: CurrentUserPermissionsService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    super(store, appService, datePipe, currentUserPermissionService);

    this.getGlobalActions = () => null;
    this.getMultiActions = () => null;

    this.getSingleActions = () => null;
    this.getSingleActions = () => null;
    this.defaultView = 'table';
    this.viewType = ListViewTypes.TABLE_ONLY;
    this.allowSelection = true;


    // Disable select if there is more than one service binding associated with a service instance
    this.dataSource.getRowState = (serviceBinding: APIResource<IServiceBinding>): Observable<RowState> => {
      if (!serviceBinding) {
        return observableOf({});
      }
      if (!this.obsCache[serviceBinding.entity.service_instance_guid]) {
        const action = AppDeleteServiceInstancesListConfigService.createFetchServiceBinding(
          appService.cfGuid,
          serviceBinding.entity.service_instance_guid
        );
        const catalogueEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, action.entityType);
        const pagObs = getPaginationObservables({
          store,
          action,
          paginationMonitor: this.paginationMonitorFactory.create(
            action.paginationKey,
            catalogueEntity.getSchema()
          )
        });
        this.obsCache[serviceBinding.entity.service_instance_guid] = pagObs.pagination$.pipe(
          map(pag => ({
            disabledReason: 'Service is attached to other applications',
            disabled: pag.totalResults > 1
          }))
        );
        // Ensure the request is made by sub'ing to the entities observable
        pagObs.entities$.pipe(
          first(),
        ).subscribe();
      }
      return this.obsCache[serviceBinding.entity.service_instance_guid];
    };
  }
}
