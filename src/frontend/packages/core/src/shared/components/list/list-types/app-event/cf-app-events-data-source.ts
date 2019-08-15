import { Store } from '@ngrx/store';

import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { GetAllAppEvents } from '../../../../../../../cloud-foundry/src/actions/app-event.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { QParam, QParamJoiners } from '../../../../../../../store/src/q-param';
import { AddParams, RemoveParams } from '../../../../../../../store/src/actions/pagination.actions';
import { IListConfig } from '../../list.component.types';
import { cfEntityFactory, appEventEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { getRowMetadata } from '../../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';

export class CfAppEventsDataSource extends ListDataSource<APIResource> {

  public getFilterFromParams(pag: PaginationEntityState) {
    const qParams = pag.params.q as string[];
    if (qParams) {
      const qParamString = qParams.find((q: string) => {
        return QParam.fromString(q).key === 'type';
      });
      return qParamString ? QParam.fromString(qParamString).value as string : '';
    }
  }
  public setFilterParam(filterString: string, pag: PaginationEntityState) {
    const config = { entityType: this.entityKey, endpointType: CF_ENDPOINT_TYPE };
    const qParams = pag.params.q as string[];
    if (filterString && filterString.length) {
      this.store.dispatch(new AddParams(config, this.paginationKey, {
        q: [
          new QParam('type', filterString, QParamJoiners.in).toString(),
        ]
      }));
    } else if (qParams.find((q: string) => QParam.fromString(q).key === 'type')) {
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
