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

  constructor(
    _store: Store<AppState>,
  ) {
    const paginationKey = 'applicationWall';
    const action = new GetAllApplications(paginationKey);

    super(
      _store,
      action,
      ApplicationSchema,
      (object: APIResource) => {
        return object.entity.metadata ? object.entity.metadata.guid : null;
      },
      () => ({} as APIResource),
      paginationKey,
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
        (entities: APIResource[], paginationState: PaginationEntityState) => {
          const upperCaseFilter = paginationState.clientPagination.filter.string.toUpperCase();
          const cfGuid = paginationState.clientPagination.filter.items['cf'];
          const orgGuid = paginationState.clientPagination.filter.items['org'];
          const spaceGuid = paginationState.clientPagination.filter.items['space'];
          return entities.filter(e => {
            if ((cfGuid && cfGuid !== e.entity.cfGuid) || (spaceGuid && spaceGuid !== e.entity.space)) {
              return false;
            }
            return true;
          });
        }
      ]
    );

    _store.dispatch(new SetListStateAction(
      paginationKey,
      'cards',
    ));
  }
}
