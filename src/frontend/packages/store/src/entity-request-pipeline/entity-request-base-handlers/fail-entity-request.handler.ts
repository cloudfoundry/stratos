import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';
import { WrapperRequestActionFailed } from '../../types/request.types';
// This might not be needed
export const failedEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType,
  action
) => {
  const entityAction = catalogueEntity.getRequestAction('failure', requestType);
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionFailed('Api Request Failed', action, requestType));
};
