import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';

export const successEntityHandler: SucceedOrFailEntityRequestHandler = (
  store,
  catalogueEntity,
  requestType
) => {
  const entityAction = catalogueEntity.getRequestAction('success', requestType);
  store.dispatch(entityAction);
};
