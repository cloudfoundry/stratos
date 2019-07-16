import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';
// This might not be needed
export const failedEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType
) => {
  const entityAction = catalogueEntity.getRequestAction('failure', requestType);
  actionDispatcher(entityAction);
};
