import { EntityInfo, APIResource } from '../../store/types/api.types';
import { EventSchema, GetAllAppEvents } from '../../store/actions/app-event.actions';
import { GetAppStatsAction } from './../../store/actions/app-metadata.actions';
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
import { AppStatSchema, AppStat } from '../../store/types/app-metadata.types';

export interface ListAppInstance {
  index: number;
  value: AppStat;
}

export class CfAppInstancesDataSource extends ListDataSource<ListAppInstance, APIResource<AppStat>> {

  constructor(
    _store: Store<AppState>,
    _cfGuid: string,
    _appGuid: string,
  ) {
    const paginationKey = `app-instances:${_cfGuid}${_appGuid}`;
    const action = new GetAppStatsAction(_appGuid, _cfGuid);

    super(
      _store,
      action,
      AppStatSchema,
      (row: ListAppInstance) => {
        return row.index.toString();
      },
      () => ({} as any),
      paginationKey,
      map(instances => {
        if (!instances || instances.length === 0) {
          return [];
        }
        const res = [];
        Object.keys(instances).forEach(key => {
          res.push({
            index: key,
            value: instances[key].entity
          });
        });
        return res;
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
