import { EntityRequestAction } from '../../../store/src/types/request.types';
import { appAutoscalerInfoEntityType, cfEntityFactory } from '../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../cf-types';

export const AUTOSCALER_INFO = '[Autoscaler] Fetch Info';

export class GetAppAutoscalerInfoAction implements EntityRequestAction {
  public guid: string;
  constructor(
    public endpointGuid: string,
  ) {
    this.guid = endpointGuid;
  }
  type = AUTOSCALER_INFO;
  entity = cfEntityFactory(appAutoscalerInfoEntityType);
  entityType = appAutoscalerInfoEntityType;
  endpointType = CF_ENDPOINT_TYPE;
}