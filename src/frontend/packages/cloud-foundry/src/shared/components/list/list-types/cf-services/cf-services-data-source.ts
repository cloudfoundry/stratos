import { Store } from '@ngrx/store';

import { getDataFunctionList, IListConfig, ListDataSource } from '@stratosui/core';
import { APIResource, endpointEntityType, entityCatalog, getRowMetadata, PaginationEntityState } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { serviceEntityType } from '../../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';

export class CfServicesDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, endpointGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointEntityType);
    const getServicesAction = cfEntityCatalog.service.actions.getMultiple(endpointGuid, paginationKey, {});
    super({
      store,
      action: getServicesAction,
      schema: entityCatalog.getEntity(CF_ENDPOINT_TYPE, serviceEntityType).getSchema(),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [
        (entities: APIResource[], paginationState: PaginationEntityState) => {
          const [filterByLabel, filterByTags] = getDataFunctionList(
            [{
              type: 'filter',
              field: 'entity.label'
            },
            {
              type: 'filter',
              field: 'entity.tags'
            }]
          )

          const labels = filterByLabel(entities, paginationState)
          const tags = filterByTags(entities, paginationState)

          // Create a Set to eliminate duplicates based on metadata.guid
          const uniqueEntitiesMap = new Map<string, APIResource>();

          // Add label matches
          labels.forEach(entity => {
            const guid = entity.metadata.guid;
            uniqueEntitiesMap.set(guid, entity);
          });

          // Add tag matches (will not duplicate if already in map)
          tags.forEach(entity => {
            const guid = entity.metadata.guid;
            uniqueEntitiesMap.set(guid, entity);
          });

          // Return deduplicated array maintaining original entity references
          return Array.from(uniqueEntitiesMap.values())
        },
        (entities: APIResource[], paginationState: PaginationEntityState) => {
          const cfGuid = paginationState.clientPagination.filter.items.cf;
          return entities.filter(e => {
            const validCF = !(cfGuid && cfGuid !== e.entity.cfGuid);
            return validCF;
          });
        }
      ],
      listConfig
    });
  }
}
