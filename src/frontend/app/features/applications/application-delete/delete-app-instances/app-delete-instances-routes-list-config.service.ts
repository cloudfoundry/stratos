import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IServiceBinding } from '../../../../core/cf-api-svc.types';
import { CurrentUserPermissionsService } from '../../../../core/current-user-permissions.service';
import { RowState } from '../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import {
  AppServiceBindingListConfigService,
} from '../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ListViewTypes } from '../../../../shared/components/list/list.component.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { FetchAllServiceBindings } from '../../../../store/actions/service-bindings.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, serviceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/types/api.types';
import { QParam } from '../../../../store/types/pagination.types';
import { ApplicationService } from '../../application.service';

@Injectable()
export class AppDeleteServiceInstancesListConfigService extends AppServiceBindingListConfigService {
  hideRefresh: boolean;
  allowSelection: boolean;
  obsCache: { [serviceGuid: string]: Observable<RowState> } = {};

  static createFetchServiceBinding = (cfGuid: string, serviceInstanceGuid: string): FetchAllServiceBindings => {
    const action = new FetchAllServiceBindings(
      cfGuid,
      createEntityRelationPaginationKey(serviceSchemaKey, serviceInstanceGuid),
    );
    action.initialParams['results-per-page'] = 1;
    action.initialParams.q = [
      new QParam('service_instance_guid', serviceInstanceGuid),
    ];
    return action;
  }

  constructor(store: Store<AppState>,
    appService: ApplicationService,
    _datePipe: DatePipe,
    currentUserPermissionService: CurrentUserPermissionsService,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    super(store, appService, _datePipe, currentUserPermissionService);

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
        const pagObs = getPaginationObservables({
          store,
          action,
          paginationMonitor: this.paginationMonitorFactory.create(
            action.paginationKey,
            entityFactory(action.entityKey)
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
