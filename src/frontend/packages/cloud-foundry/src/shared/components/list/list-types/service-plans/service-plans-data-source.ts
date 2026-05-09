import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { IListConfig, ListDataSource } from '@stratosui/core';
import { APIResource, PaginatedAction } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import {
  serviceEntityType,
  serviceInstancesEntityType,
  servicePlanEntityType,
} from '../../../../../cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../entity-relations/entity-relations.types';
import {
  apiResourceToStServicePlan,
} from '../../../../../features/service-catalog/services-helper';
import { IServicePlan } from '../../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { StServicePlan } from '../../../../../services/endpoint-data/stratos-types';

/**
 * Offering-detail Plans tab data source. Reads V2 plan entities through the
 * legacy ngrx pagination store and adapts them to the V3 nested-ref
 * StServicePlan shape via the `transformEntity` operator. The shape adapter
 * keeps the embedded service-plan-public and service-plan-price components
 * (and their table-cell wrappers) on a single shape — the same
 * StServicePlan that the bind-flow's signal-driven helper provides.
 *
 * Type parameters: T = StServicePlan (list/cell row shape), A =
 * APIResource<IServicePlan> (store/wire shape). transformEntity does the
 * one-row-per-emission mapping between them.
 *
 * The wire read path stays ngrx for now; a future slice migrates this tab
 * to signal-list-config reading from EndpointDataService.servicePlans()
 * directly, at which point the adapter retires.
 */
export class ServicePlansDataSource extends ListDataSource<StServicePlan, APIResource<IServicePlan>> {
  constructor(
    cfGuid: string,
    serviceGuid: string,
    store: Store<CFAppState>,
    listConfig: IListConfig<StServicePlan>,
  ) {

    const paginationKey = createEntityRelationPaginationKey(serviceInstancesEntityType, serviceGuid);
    const action = cfEntityCatalog.servicePlan.actions.getAllForServiceInstance(serviceGuid, cfGuid, paginationKey, [
      createEntityRelationKey(servicePlanEntityType, serviceEntityType),
    ]) as PaginatedAction;

    super({
      store,
      action,
      schema: cfEntityFactory(servicePlanEntityType),
      // getRowUniqueId runs on the store-shape (A = APIResource<IServicePlan>)
      // BEFORE transformEntity adapts to StServicePlan, so read metadata.guid
      // from the wire shape directly here.
      getRowUniqueId: (row: APIResource<IServicePlan>) => row.metadata.guid,
      paginationKey,
      isLocal: true,
      transformEntity: map((entities: APIResource<IServicePlan>[]) =>
        (entities ?? []).map(apiResourceToStServicePlan),
      ),
      transformEntities: [
        { type: 'filter', field: 'name' },
      ],
      listConfig,
    });
  }
}
