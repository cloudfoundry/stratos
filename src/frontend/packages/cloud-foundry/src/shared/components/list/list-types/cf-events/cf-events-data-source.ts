import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';

import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { cfEventEntityType } from '../../../../../cf-entity-types';
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
    const paginationKey = CfEventsDataSource.createPaginationKey(
      cfGuid,
      orgGuid,
      spaceGuid,
      actee
    );

    const action = cfEntityCatalog.event.actions.getMultiple(cfGuid, paginationKey)

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
