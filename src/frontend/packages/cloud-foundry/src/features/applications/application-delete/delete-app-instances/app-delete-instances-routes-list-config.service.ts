import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { FetchAllServiceBindings } from '../../../../../../cloud-foundry/src/actions/service-bindings.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { serviceBindingEntityType, serviceEntityType } from '../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { IServiceBinding } from '../../../../../../core/src/core/cf-api-svc.types';
import { CurrentUserPermissionsService } from '../../../../../../core/src/core/current-user-permissions.service';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { RowState } from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { ListViewTypes } from '../../../../../../core/src/shared/components/list/list.component.types';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { QParam } from '../../../../shared/q-param';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../store/src/types/api.types';
import {
  AppServiceBindingListConfigService,
} from '../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ServiceActionHelperService } from '../../../../shared/data-services/service-action-helper.service';
import { ApplicationService } from '../../application.service';

@Injectable()
export class AppDeleteServiceInstancesListConfigService extends AppServiceBindingListConfigService {
  hideRefresh: boolean;
  allowSelection: boolean;
  obsCache: { [serviceGuid: string]: Observable<RowState> } = {};

  static createFetchServiceBinding = (cfGuid: string, serviceInstanceGuid: string): FetchAllServiceBindings => {
    const sgEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceBindingEntityType);
    const actionBuilder = sgEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const action = actionBuilder(
      cfGuid,
      createEntityRelationPaginationKey(serviceEntityType, serviceInstanceGuid)) as FetchAllServiceBindings;
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
    private paginationMonitorFactory: PaginationMonitorFactory,
    serviceActionHelperService: ServiceActionHelperService
  ) {
    super(store, appService, datePipe, currentUserPermissionService, serviceActionHelperService);

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
        const catalogEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, action.entityType);
        const pagObs = getPaginationObservables({
          store,
          action,
          paginationMonitor: this.paginationMonitorFactory.create(
            action.paginationKey,
            catalogEntity.getSchema()
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
