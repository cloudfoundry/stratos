import { Subscription } from 'rxjs/Rx';
import { ListDataSource } from './list-data-source';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { GetAllApplications, ApplicationSchema } from '../../store/actions/application.actions';
import { SetListStateAction, ListFilter } from '../../store/actions/list.actions';
import { SortDirection } from '@angular/material';
import { AddParams, RemoveParams } from '../../store/actions/pagination.actions';
import { APIResource } from '../../store/types/api.types';
import { ListActions } from './list-data-source-types';
import { PaginationEntityState } from '../../store/types/pagination.types';

export class CfAppsDataSource extends ListDataSource<APIResource> {

  public static paginationKey = 'applicationWall';

  constructor(
    _store: Store<AppState>,
  ) {
    const action = new GetAllApplications(CfAppsDataSource.paginationKey);

    super(
      _store,
      action,
      ApplicationSchema,
      (entity: APIResource) => {
        return entity.metadata ? entity.metadata.guid : null;
      },
      () => ({} as APIResource),
      CfAppsDataSource.paginationKey,
      null,
      true,
      [
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
    );

    _store.dispatch(new SetListStateAction(
      CfAppsDataSource.paginationKey,
      'cards',
    ));
  }
}
