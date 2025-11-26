import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { ListDataSource, getDefaultRowState, type IListConfig } from '@stratosui/core';
import { getRowMetadata, endpointEntityType, type APIResource, type GeneralEntityAppState } from '@stratosui/store';
import { GetQuotaDefinitions } from '../../../../../actions/quota-definitions.actions';
import type { CFAppState } from '../../../../../cf-app-state';
import type { IQuotaDefinition } from '../../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { quotaDefinitionEntityType } from '../../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';

export class CfQuotasDataSourceService extends ListDataSource<APIResource<IQuotaDefinition>> {

  constructor(store: Store<GeneralEntityAppState>, cfGuid: string, listConfig?: IListConfig<APIResource<IQuotaDefinition>>) {
    const quotaPaginationKey = createEntityRelationPaginationKey(endpointEntityType, cfGuid);
    const action = new GetQuotaDefinitions(quotaPaginationKey, cfGuid);

    super({
      store,
      action,
      schema: cfEntityFactory(quotaDefinitionEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });

    this.setGetRowState();
  }

  setGetRowState() {
    this.getRowState = (row) => {
      if (!this.sourceScheme || !row) {
        return of(getDefaultRowState());
      }
      return cfEntityCatalog.quotaDefinition.store.getEntityMonitor(this.getRowUniqueId(row)).entityRequest$.pipe(
        distinctUntilChanged(),
        map(requestInfo => ({
          deleting: requestInfo.deleting.busy,
          error: requestInfo.deleting.error,
          message: requestInfo.deleting.error ? `Failed to delete quota: ${requestInfo.deleting.message}` : null
        }))
      );
    };
  }
}
