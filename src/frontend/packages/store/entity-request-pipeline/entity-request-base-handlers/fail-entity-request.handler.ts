import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';

export const failedEntityHandler: SucceedOrFailEntityRequestHandler = (
  store,
  catalogueEntity,
  requestType
) => {
  const entityAction = catalogueEntity.getRequestAction('failure', requestType);
  store.dispatch(entityAction);
};
