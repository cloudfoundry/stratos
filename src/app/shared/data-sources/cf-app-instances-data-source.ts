import { EntityInfo } from '../../store/types/api.types';
import { EventSchema, GetAllAppEvents } from '../../store/actions/app-event.actions';
import { GetAppInstancesAction, InstanceSchema } from './../../store/actions/app-metadata.actions';
import { AppState } from '../../store/app-state';
import { Subscription } from 'rxjs/Rx';
import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { MatPaginator, PageEvent, MatSort, Sort, SortDirection } from '@angular/material';

import { map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { schema } from 'normalizr';
import { ListDataSource } from './list-data-source';
import { PaginationEntityState, QParam } from '../../store/types/pagination.types';
import { AddParams, RemoveParams } from '../../store/actions/pagination.actions';
import { ListFilter, SetListStateAction, ListPagination } from '../../store/actions/list.actions';

export class CfAppInstancesDataSource extends ListDataSource<any> {

  constructor(
    _store: Store<AppState>,
    _cfGuid: string,
    _appGuid: string,
  ) {
    const paginationKey = `app-instances:${_cfGuid}${_appGuid}`;
    const action =         new GetAppInstancesAction(_appGuid, _cfGuid);

    super(
      _store,
      action,
      InstanceSchema,
      (object: any) => {
        // TODO: This needs to return the unique identifier for each row - used for the checkbox selection
        // and multiple actions
        return '1';
      },
      () => ({} as any),
      paginationKey,
      map(instances => {
        return Object.keys(instances[0]).map(index => ({ index, value: instances[0][index] }));
      }),
      true,
      []
    );

    _store.dispatch(new SetListStateAction(
      paginationKey,
      'table',
    ));
  }
}
