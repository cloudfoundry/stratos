import { Store } from '@ngrx/store';
import { schema } from 'normalizr';

import { EventSchema, GetAllAppEvents } from '../../../../../store/actions/app-event.actions';
import { SetListStateAction } from '../../../../../store/actions/list.actions';
import { AddParams, RemoveParams } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import { EntityInfo } from '../../../../../store/types/api.types';
import { PaginationEntityState, QParam } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';

export class CfAppEventsDataSource extends ListDataSource<EntityInfo> {

  public getFilterFromParams(pag: PaginationEntityState) {
    const qParams = pag.params.q;
    if (qParams) {
      const qParam = qParams.find((q: QParam) => {
        return q.key === 'type';
      });
      return qParam ? qParam.value as string : '';
    }
  }
  public setFilterParam(filterString: string, pag: PaginationEntityState) {
    if (filterString && filterString.length) {
      this.store.dispatch(new AddParams(this.entityKey, this.paginationKey, {
        q: [
          new QParam('type', filterString, ' IN '),
        ]
      }));
    } else if (pag.params.q.find((q: QParam) => q.key === 'type')) {
      this.store.dispatch(new RemoveParams(this.entityKey, this.paginationKey, [], ['type']));
    }
  }

  constructor(
    store: Store<AppState>,
    _cfGuid: string,
    _appGuid: string,
  ) {
    const paginationKey = `app-events:${_cfGuid}${_appGuid}`;
    const action = new GetAllAppEvents(paginationKey, _appGuid, _cfGuid);

    super(
      {
        store,
        action,
        schema: EventSchema,
        getRowUniqueId: (object: EntityInfo) => {
          return object.entity.metadata ? object.entity.metadata.guid : null;
        },
        paginationKey,
      }
    );

    store.dispatch(new SetListStateAction(
      paginationKey,
      'table',
    ));

  }

}
