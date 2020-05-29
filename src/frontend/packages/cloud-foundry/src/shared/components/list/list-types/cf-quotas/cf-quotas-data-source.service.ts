import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';
import { of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { GetQuotaDefinitions } from '../../../../../../../cloud-foundry/src/actions/quota-definitions.actions';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  getDefaultRowState,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { endpointSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { EntityMonitor } from '../../../../../../../store/src/monitors/entity-monitor';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { quotaDefinitionEntityType } from '../../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';

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
