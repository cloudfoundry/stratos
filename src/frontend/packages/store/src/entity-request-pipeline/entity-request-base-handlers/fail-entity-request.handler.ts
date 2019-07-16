import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';

export const failedEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType
) => {
  const entityAction = catalogueEntity.getRequestAction('failure', requestType);
  actionDispatcher(entityAction);
};
