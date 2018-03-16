import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { GetAllApplications } from '../../../../../store/actions/application.actions';
import { AppState } from '../../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey, routeSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginationEntityState } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { createEntityRelationKey } from '../../../../../store/helpers/entity-relations.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

export class CfAppsDataSource extends ListDataSource<APIResource> {

  public static paginationKey = 'applicationWall';

  constructor(
    store: Store<AppState>,
    listConfig?: IListConfig<APIResource>
  ) {
    const { paginationKey } = CfAppsDataSource;
    const action = new GetAllApplications(paginationKey, [
      createEntityRelationKey(applicationSchemaKey, spaceSchemaKey),
      createEntityRelationKey(applicationSchemaKey, routeSchemaKey),
    ]);

    super({
      store,
      action,
      schema: entityFactory(applicationSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'entity.name'
        },
        (entities: APIResource[], paginationState: PaginationEntityState) => {
          // Filter by cf/org/space
          const cfGuid = paginationState.clientPagination.filter.items['cf'];
          const orgGuid = paginationState.clientPagination.filter.items['org'];
          const spaceGuid = paginationState.clientPagination.filter.items['space'];
          return entities.filter(e => {
            const validCF = !(cfGuid && cfGuid !== e.entity.cfGuid);
            const validOrg = !(orgGuid && orgGuid !== e.entity.space.entity.organization_guid);
            const validSpace = !(spaceGuid && spaceGuid !== e.entity.space_guid);
            return validCF && validOrg && validSpace;
          });
        }
      ],
      listConfig
    }
    );

  }
}
