import { EntityInfo } from '../../store/types/api.types';
import { EventSchema, GetAllAppEvents } from '../../store/actions/app-event.actions';
import { AppState } from '../../store/app-state';
import { Subscription } from 'rxjs/Rx';
import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { MatPaginator, PageEvent, MatSort, Sort, SortDirection } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { schema } from 'normalizr';
import { ListDataSource } from './list-data-source-cf';
import { PaginationEntityState, QParam } from '../../store/types/pagination.types';
import { AddParams, RemoveParams } from '../../store/actions/pagination.actions';
import { ListFilter, SetListStateAction, ListPagination } from '../../store/actions/list.actions';

export class CfAppEventsDataSource extends ListDataSource<EntityInfo> {

  public getFilterFromParams(pag: PaginationEntityState) {
    const q = pag.params.q;
    if (q) {
      const qParam = q.find((q: QParam) => {
        return q.key === 'type';
      });
      return qParam ? qParam.value as string : '';
    }
  }
  public setFilterParam(filter: ListFilter) {
    if (filter && filter.filter && filter.filter.length) {
      this._store.dispatch(new AddParams(this.entityKey, this.paginationKey, {
        q: [
          new QParam('type', filter.filter, ' IN '),
        ]
      }));
    } else {
      // if (pag.params.q.find((q: QParam) => q.key === 'type'))
      this._store.dispatch(new RemoveParams(this.entityKey, this.paginationKey, [], ['type']));
    }
  }

  constructor(
    _store: Store<AppState>,
    _cfGuid: string,
    _appGuid: string,
  ) {
    const paginationKey = `app-events:${_cfGuid}${_appGuid}`;
    const action = new GetAllAppEvents(paginationKey, _appGuid, _cfGuid);

    super(
      _store,
      action,
      EventSchema,
      (object: EntityInfo) => {
        return object.entity.metadata ? object.entity.metadata.guid : null;
      },
      () => ({} as EntityInfo),
      paginationKey,
      null,
      false,
      []
    );

    _store.dispatch(new SetListStateAction(
      paginationKey,
      'table',
    ));


    // TODO: RC We'll need to do this somewhere but not here
    // const cfFilter$ = this.filter$.withLatestFrom(this.pagination$)
    //   .do(([filter, pag]: [ListFilter, PaginationEntityState]) => {
    //     if (filter && filter.filter && filter.filter.length) {
    //       const q = pag.params.q;
    //       this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
    //         q: [
    //           new QParam('type', filter.filter, ' IN '),
    //         ]
    //       }));
    //     } else if (pag.params.q.find((q: QParam) => q.key === 'type')) {
    //       this._cfStore.dispatch(new RemoveParams(this.sourceScheme.key, this.action.paginationKey, [], ['type']));
    //     }
    //   });
    // this.cfFilterSub = cfFilter$.subscribe();

  }

}
