import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { GetOrganizationSpaceQuotaDefinitions } from '../../../../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  endpointSchemaKey,
  entityFactory,
  spaceQuotaSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { EntityMonitor } from '../../../../monitors/entity-monitor';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { getDefaultRowState } from '../../data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../list.component.types';

export class CfOrgSpaceQuotasDataSourceService extends ListDataSource<APIResource> {

  constructor(store: Store<AppState>, orgGuid: string, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const quotaPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    const action = new GetOrganizationSpaceQuotaDefinitions(quotaPaginationKey, orgGuid, cfGuid);

    super({
      store,
      action,
      schema: entityFactory(spaceQuotaSchemaKey),
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
          message: requestInfo.deleting.error ? `Failed to delete space quota: ${requestInfo.message}` : null
        }))
      );
    };
  }
}
