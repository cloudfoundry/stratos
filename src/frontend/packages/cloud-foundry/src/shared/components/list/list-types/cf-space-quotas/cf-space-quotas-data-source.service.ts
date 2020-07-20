import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratosui/store';
import { of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import {
  getDefaultRowState,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { endpointEntityType } from '../../../../../../../store/src/helpers/stratos-entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { GetOrganizationSpaceQuotaDefinitions } from '../../../../../actions/quota-definitions.actions';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { spaceQuotaEntityType } from '../../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';

export class CfOrgSpaceQuotasDataSourceService extends ListDataSource<APIResource> {

  constructor(store: Store<CFAppState>, orgGuid: string, cfGuid: string, listConfig?: IListConfig<APIResource>) {
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
