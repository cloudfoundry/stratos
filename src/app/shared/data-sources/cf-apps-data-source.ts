import { Subscription } from 'rxjs/Rx';
import { CfListDataSource } from './list-data-source-cf';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { GetAllApplications, ApplicationSchema } from '../../store/actions/application.actions';
import { SetListStateAction, ListFilter } from '../../store/actions/list.actions';
import { SortDirection } from '@angular/material';
import { PaginationEntityState, QParam } from '../../store/types/pagination.types';
import { AddParams, RemoveParams } from '../../store/actions/pagination.actions';
import { APIResource } from '../../store/types/api.types';
import { ListActions } from './list-data-source-types';


export class CfAppsDataSource extends CfListDataSource<APIResource> {

  cfFilterSub: Subscription;

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
      paginationKey
    );

    _store.dispatch(new SetListStateAction(
      paginationKey,
      'cards',
      {
        pageIndex: 0,
        pageSize: 50,
        totalResults: 0,
      },
      {
        direction: action.initialParams['order-direction'] as SortDirection,
        field: action.initialParams['order-direction-field'],
      },
      {
        filter: ''
      }));

    // const cfFilter$ = this.filter$.withLatestFrom(this.pag$)
    //   .do(([filter, pag]: [ListFilter, PaginationEntityState]) => {
    //     if (filter && filter.filter && filter.filter.length) {
    //       const q = pag.params.q;
    //       this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
    //         q: [
    //           new QParam('name', filter.filter, ' IN '),
    //         ]
    //       }));
    //     } else if (pag.params.q.find((q: QParam) => q.key === 'name')) {
    //       this._cfStore.dispatch(new RemoveParams(this.sourceScheme.key, this.action.paginationKey, [], ['name']));
    //     }
    //   });
    // this.cfFilterSub = cfFilter$.subscribe();

  }

  destroy() {
    this.cfFilterSub.unsubscribe();
    super.destroy();
  }
}
