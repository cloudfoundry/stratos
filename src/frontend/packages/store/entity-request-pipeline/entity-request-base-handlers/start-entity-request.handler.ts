import { StartRequestAction } from '../../src/types/request.types';
import { StartEntityRequestHandler } from '../entity-request-pipeline.types';

export const startEntityHandler: StartEntityRequestHandler = (
  store,
  catalogueEntity,
  requestType,
  action
) => {
  const entityAction = catalogueEntity.getRequestAction('start', requestType);
  store.dispatch(new StartRequestAction(action, requestType));
  store.dispatch(entityAction);
};
