import { Store } from '@ngrx/store';

import { entityCatalogue } from '../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { AddParams, RemoveParams } from '../../../../../../../store/src/actions/pagination.actions';
import { QParam, QParamJoiners } from '../../../../../../../store/src/q-param';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { appEventEntityType } from '../../../../../cf-entity-types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';

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
    const appEventEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, appEventEntityType);
    const actionBuilder = appEventEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const action = actionBuilder(cfGuid, paginationKey, { appGuid });

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
