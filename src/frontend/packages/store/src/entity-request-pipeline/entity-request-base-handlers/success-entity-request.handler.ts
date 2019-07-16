import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';

export const successEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType
) => {
  const entityAction = catalogueEntity.getRequestAction('success', requestType);
  actionDispatcher(entityAction);
};
