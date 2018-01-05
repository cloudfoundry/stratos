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

  // cfFilterSub: Subscription;

  public getFilterFromParams(pag: PaginationEntityState) {
    const q = pag.params.q;
    if (q) {
      const qParam = q.find((q: QParam) => {
        return q.key === 'name';
      });
      return qParam ? qParam.value as string : '';
    }
  }
  public setFilterParam(filter: ListFilter) {
    if (filter && filter.filter && filter.filter.length) {
      this._cfStore.dispatch(new AddParams(this.entityKey, this.paginationKey, {
        q: [
          new QParam('name', filter.filter, ' IN '),
        ]
      }, this.isLocal));
    } else {
      // if (pag.params.q.find((q: QParam) => q.key === 'name'))
      this._cfStore.dispatch(new RemoveParams(this.entityKey, this.paginationKey, [], ['name'], this.isLocal));
    }
  }

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

  destroy() {
    super.destroy();
  }
}
