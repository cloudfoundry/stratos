import { Store } from '@ngrx/store';

import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { GetAllAppEvents } from '../../../../../../../cloud-foundry/src/actions/app-event.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { appEventEntityType, cfEntityFactory } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { AddParams, RemoveParams } from '../../../../../../../store/src/actions/pagination.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState, QParam } from '../../../../../../../store/src/types/pagination.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

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
    const config = { entityType: this.entityKey, endpointType: CF_ENDPOINT_TYPE };
    if (filterString && filterString.length) {
      this.store.dispatch(new AddParams(config, this.paginationKey, {
        q: [
          new QParam('type', filterString, ' IN '),
        ]
      }));
    } else if (pag.params.q.find((q: QParam) => q.key === 'type')) {
      this.store.dispatch(new RemoveParams(config, this.paginationKey, [], ['type']));
    }
  }

  constructor(
    store: Store<CFAppState>,
    cfGuid: string,
    appGuid: string,
    listConfig: IListConfig<APIResource>
  ) {
    const paginationKey = `app-events:${cfGuid}${appGuid}`;
    const action = new GetAllAppEvents(paginationKey, appGuid, cfGuid);

    super(
      {
        store,
        action,
        schema: cfEntityFactory(appEventEntityType),
        getRowUniqueId: getRowMetadata,
        paginationKey,
        listConfig
      }
    );

  }

}
