import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../../store/src/app-state';
import { EntityInfo } from '../../../../../../../store/src/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { entityFactory, appAutoscalerPolicySchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { GetAppAutoscalerPolicyTriggerAction } from '../../../../../../../store/src/actions/app-autoscaler.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';

export class AppAutoscalerMetricChartDataSource extends ListDataSource<APIResource<any>> {
  action: any;
  constructor(
    store: Store<AppState>,
    cfGuid: string,
    appGuid: string,
  ) {
    const paginationKey = `app-autoscaler-policy-triggers:${cfGuid}${appGuid}`;
    const action = new GetAppAutoscalerPolicyTriggerAction(paginationKey, appGuid, cfGuid);
    super(
      {
        store,
        action,
        schema: entityFactory(appAutoscalerPolicySchemaKey),
        getRowUniqueId: (object: EntityInfo) => {
          return object.entity.metadata ? object.entity.metadata.guid : null;
        },
        paginationKey,
      }
    );
  }
}
