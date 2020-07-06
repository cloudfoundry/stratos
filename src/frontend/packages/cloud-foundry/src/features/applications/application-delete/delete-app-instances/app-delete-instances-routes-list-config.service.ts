import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { serviceBindingEntityType } from '../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';
import { RowState } from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { ListViewTypes } from '../../../../../../core/src/shared/components/list/list.component.types';
import { endpointEntityType } from '../../../../../../store/src/helpers/stratos-entity-factory';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceBinding } from '../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import {
  AppServiceBindingListConfigService,
} from '../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ServiceActionHelperService } from '../../../../shared/data-services/service-action-helper.service';
import { fetchTotalResults } from '../../../cloud-foundry/cf.helpers';
import { ApplicationService } from '../../application.service';

@Injectable()
export class AppDeleteServiceInstancesListConfigService extends AppServiceBindingListConfigService {
  hideRefresh: boolean;
  allowSelection: boolean;
  obsCache: { [serviceGuid: string]: Observable<RowState> } = {};

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
        const action = cfEntityCatalog.serviceBinding.actions.getAllForServiceInstance(
          serviceBinding.entity.service_instance_guid,
          appService.cfGuid,
          createEntityRelationPaginationKey(endpointEntityType, serviceBindingEntityType),
          {
            includeRelations: [],
          }
        )
        this.obsCache[serviceBinding.entity.service_instance_guid] = fetchTotalResults(
          action,
          store,
          this.paginationMonitorFactory
        ).pipe(
          map(totalResults => ({
            disabledReason: 'Service is attached to other applications',
            disabled: totalResults > 1
          }))
        );
      }
      return this.obsCache[serviceBinding.entity.service_instance_guid];
    };
  }
}
