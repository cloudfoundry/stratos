import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAppAutoscalerPolicyTriggerAction } from '../../../app-autoscaler.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { appAutoscalerPolicySchemaKey, entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { ListDataSource } from '../../../../../shared/components/list/data-sources-controllers/list-data-source';

export class AppAutoscalerMetricChartDataSource extends ListDataSource<APIResource> {
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
        getRowUniqueId: getRowMetadata,
        paginationKey,
        isLocal: true
      }
    );
  }
}
