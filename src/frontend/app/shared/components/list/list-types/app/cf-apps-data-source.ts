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

  private isValidFilter<T>(list: T[], value: T): boolean {
    return !(list && list.length && !list.find(item => item === value));
  }

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
          const cfGuids: string[] = paginationState.clientPagination.filter.items['cf'];
          const orgGuids: string[] = paginationState.clientPagination.filter.items['org'];
          const spaceGuids: string[] = paginationState.clientPagination.filter.items['space'];
          return entities.filter(e => {
            return this.isValidFilter(cfGuids, e.entity.cfGuid) &&
              this.isValidFilter(orgGuids, e.entity.space.entity.organization_guid) &&
              this.isValidFilter(spaceGuids, e.entity.space_guid);
          });
        }
      ],
      listConfig
    }
    );

  }
}
