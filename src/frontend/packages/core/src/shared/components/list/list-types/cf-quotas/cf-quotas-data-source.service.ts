import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { GetQuotaDefinitions } from '../../../../../../../cloud-foundry/src/actions/quota-definitions.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { cfEntityFactory } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { quotaDefinitionEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { getRowMetadata } from '../../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { EntityMonitor } from '../../../../../../../store/src/monitors/entity-monitor';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { getDefaultRowState } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';

export class CfQuotasDataSourceService extends ListDataSource<APIResource> {

  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const quotaPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
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
      const entityMonitor = new EntityMonitor(this.store, this.getRowUniqueId(row), this.entityKey, this.sourceScheme);
      return entityMonitor.entityRequest$.pipe(
        distinctUntilChanged(),
        map(requestInfo => ({
          deleting: requestInfo.deleting.busy,
          error: requestInfo.deleting.error,
          message: requestInfo.deleting.error ? `Failed to delete quota: ${requestInfo.message}` : null
        }))
      );
    };
  }
}
