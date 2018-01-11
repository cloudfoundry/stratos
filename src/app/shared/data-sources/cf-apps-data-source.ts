import { Subscription } from 'rxjs/Rx';
import { ListDataSource } from './list-data-source';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { GetAllApplications, ApplicationSchema } from '../../store/actions/application.actions';
import { SetListStateAction, ListFilter } from '../../store/actions/list.actions';
import { SortDirection } from '@angular/material';
import { PaginationEntityState, QParam } from '../../store/types/pagination.types';
import { AddParams, RemoveParams } from '../../store/actions/pagination.actions';
import { APIResource } from '../../store/types/api.types';
import { ListActions } from './list-data-source-types';

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
        }
      ]
    );

    _store.dispatch(new SetListStateAction(
      paginationKey,
      'cards',
    ));
  }
}
