import { Store } from '@ngrx/store';
import { GetAppAutoscalerScalingHistoryAction } from '../../../../../../../store/src/actions/app-autoscaler.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { EntityInfo } from '../../../../../../../store/src/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { appAutoscalerScalingHistorySchemaKey } from '../../../../../../../store/src/helpers/entity-factory';

export class CfAppAutoscalerEventsDataSource extends ListDataSource<EntityInfo> {
  action: any;
  constructor(
    store: Store<AppState>,
    cfGuid: string,
    appGuid: string,
  ) {
    const paginationKey = `app-autoscaler-events:${cfGuid}${appGuid}`;
    const action = new GetAppAutoscalerScalingHistoryAction(paginationKey, appGuid, cfGuid);
    super(
      {
        store,
        action,
        schema: entityFactory(appAutoscalerScalingHistorySchemaKey),
        getRowUniqueId: (object: EntityInfo) => {
          return object.entity.metadata ? object.entity.metadata.guid : null;
        },
        paginationKey,
      }
    );
  }
}
