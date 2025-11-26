import { Store } from '@ngrx/store';
import { getRowMetadata, type GeneralEntityAppState } from '@stratosui/store';
import { of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import {
  ListDataSource,
} from '@stratosui/core';
import {
  getDefaultRowState,
} from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import { endpointEntityType } from '../../../../../../../store/src/helpers/stratos-entity-factory';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import { GetOrganizationSpaceQuotaDefinitions } from '../../../../../actions/quota-definitions.actions';
import type { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { spaceQuotaEntityType } from '../../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';

export class CfOrgSpaceQuotasDataSourceService extends ListDataSource<APIResource> {

  constructor(store: Store<GeneralEntityAppState>, orgGuid: string, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const quotaPaginationKey = createEntityRelationPaginationKey(endpointEntityType, cfGuid);
    const action = new GetOrganizationSpaceQuotaDefinitions(quotaPaginationKey, orgGuid, cfGuid);

    super({
      store,
      action,
      schema: cfEntityFactory(spaceQuotaEntityType),
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

      return cfEntityCatalog.spaceQuota.store.getEntityMonitor(this.getRowUniqueId(row)).entityRequest$.pipe(
        distinctUntilChanged(),
        map(requestInfo => ({
          deleting: requestInfo.deleting.busy,
          error: requestInfo.deleting.error,
          message: requestInfo.deleting.error ? `Failed to delete space quota: ${requestInfo.deleting.message}` : null
        }))
      );
    };
  }
}
