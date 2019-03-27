import { Store } from '@ngrx/store';

import { GetAllAppEvents } from '../../../../../../../store/src/actions/app-event.actions';
import { AddParams, RemoveParams } from '../../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { appEventSchemaKey, entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState, QParam } from '../../../../../../../store/src/types/pagination.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';

export class CfAppEventsDataSource extends ListDataSource<APIResource> {

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
    cfGuid: string,
    appGuid: string,
  ) {
    const paginationKey = `app-events:${cfGuid}${appGuid}`;
    const action = new GetAllAppEvents(paginationKey, appGuid, cfGuid);

    super(
      {
        store,
        action,
        schema: entityFactory(appEventSchemaKey),
        getRowUniqueId: getRowMetadata,
        paginationKey,
      }
    );

  }

}
