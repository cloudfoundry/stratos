import { Store } from '@ngrx/store';

import { ApplicationSchema, GetAllApplications } from '../../../../../store/actions/application.actions';
import { SetListStateAction } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginationEntityState } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';



export class CfAppsDataSource extends ListDataSource<APIResource> {

  public static paginationKey = 'applicationWall';

  constructor(
    store: Store<AppState>,
  ) {
    const { paginationKey } = CfAppsDataSource;
    const action = new GetAllApplications(paginationKey);

    super({
      store,
      action,
      schema: ApplicationSchema,
      getRowUniqueId: (entity: APIResource) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      paginationKey,
      isLocal: true,
      entityFunctions: [
        {
          type: 'filter',
          field: 'entity.name'
        },
        {
          type: 'sort',
          orderKey: 'creation',
          field: 'metadata.created_at'
        },
        {
          type: 'sort',
          orderKey: 'name',
          field: 'entity.name'
        },
        {
          type: 'sort',
          orderKey: 'instances',
          field: 'entity.instances'
        },
        {
          type: 'sort',
          orderKey: 'disk_quota',
          field: 'entity.disk_quota'
        },
        {
          type: 'sort',
          orderKey: 'memory',
          field: 'entity.memory'
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
      ]
    }
    );

    store.dispatch(new SetListStateAction(
      paginationKey,
      'cards',
    ));
  }
}
