import { Store } from '@ngrx/store';

import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../../../../store/src/entity-catalog/entity-catalog.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { cfEventEntityType } from '../../../../../cf-entity-types';
import { CfEventActionBuilders } from '../../../../../entity-action-builders/cf-event.action-builders';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { QParam, QParamJoiners } from '../../../../q-param';

export class CfEventsDataSource extends ListDataSource<APIResource> {

  constructor(
    store: Store<CFAppState>,
    cfGuid: string,
    listConfig: IListConfig<APIResource>,
    orgGuid?: string,
    spaceGuid?: string,
    actee?: string,
  ) {
    const appEventEntity = entityCatalog.getEntity<IEntityMetadata, any, CfEventActionBuilders>(
      CF_ENDPOINT_TYPE,
      cfEventEntityType
    );
    const actionBuilder = appEventEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const paginationKey = CfEventsDataSource.createPaginationKey(
      cfGuid,
      orgGuid,
      spaceGuid,
      actee
    );
    const action = actionBuilder(cfGuid, paginationKey);

    action.initialParams.q = CfEventsDataSource.createInitialQParams(
      orgGuid,
      spaceGuid,
      actee
    );

    super(
      {
        store,
        action,
        schema: cfEntityFactory(cfEventEntityType),
        getRowUniqueId: getRowMetadata,
        paginationKey: action.paginationKey,
        listConfig
      }
    );

  }

  private static createInitialQParams(
    orgGuid?: string,
    spaceGuid?: string,
    acteeGuid?: string,
  ): string[] {
    const res = [];
    if (orgGuid) {
      res.push(
        new QParam('organization_guid', orgGuid, QParamJoiners.colon).toString(),
      );
    }
    if (spaceGuid) {
      res.push(
        new QParam('space_guid', spaceGuid, QParamJoiners.colon).toString(),
      );
    }
    if (acteeGuid) {
      res.push(
        new QParam('actee', acteeGuid, QParamJoiners.colon).toString(),
      );
    }
    return res;
  }

  private static createPaginationKey(
    cfGuid: string,
    orgGuid?: string,
    spaceGuid?: string,
    appGuid?: string,
  ): string {
    if (appGuid) {
      return `${cfGuid}:app:${appGuid}`;
    } else if (spaceGuid) {
      return `${cfGuid}:space:${spaceGuid}`;
    } else if (orgGuid) {
      return `${cfGuid}:org:${orgGuid}`;
    }
    return null;
  }
}
