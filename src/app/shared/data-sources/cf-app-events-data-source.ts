import { EntityInfo } from '../../store/types/api.types';
import { EventSchema, GetAllAppEvents } from '../../store/actions/app-event.actions';
import { AppState } from '../../store/app-state';
import { Subscription } from 'rxjs/Rx';
import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { MdPaginator, PageEvent, MdSort, Sort, SortDirection } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { schema } from 'normalizr';
import { CfTableDataSource } from './table-data-source-cf';
import { PaginationEntityState, QParam } from '../../store/types/pagination.types';
import { AddParams, RemoveParams, SetParams } from '../../store/actions/pagination.actions';
import { ListFilter, SetListStateAction } from '../../store/actions/list.actions';

// TODO: RC KEEP AND MOVE TO TYPES
export interface AppEvent {
  actee_name: string;
  actee_type: string;
  actor: string;
  actor_name: string;
  actor_type: string;
  actor_username: string;
  metadata: Object;
  organization_guid: string;
  space_guid: string;
  timestamp: string;
  type: string;
}

export class CfAppEventsDataSource extends CfTableDataSource<EntityInfo> {

  cfFilterSub: Subscription;

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
      {} as EntityInfo,
      paginationKey
    );

    _store.dispatch(new SetListStateAction(
      paginationKey,
      'table',
      {
        pageIndex: 0,
        pageSize: 5,
        pageSizeOptions: [5, 10, 15],
        totalResults: 0,
      },
      {
        direction: action.initialParams['order-direction'] as SortDirection,
        field: action.initialParams['order-direction-field']
      },
      {
        filter: ''
      }));


    const cfFilter$ = this.listFilter$.withLatestFrom(this.cfPagination$)
      .do(([filter, pag]: [ListFilter, PaginationEntityState]) => {
        if (filter && filter.filter && filter.filter.length) {
          const q = pag.params.q;
          this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
            q: [
              new QParam('type', filter.filter, ' IN '),
            ]
          }));
        } else if (pag.params.q.find((q: QParam) => q.key === 'type')) {
          this._cfStore.dispatch(new RemoveParams(this.sourceScheme.key, this.action.paginationKey, [], ['type']));
        }
      });
    this.cfFilterSub = cfFilter$.subscribe();

  }

  destroy() {
    this.cfFilterSub.unsubscribe();
    super.destroy();
  }
}
