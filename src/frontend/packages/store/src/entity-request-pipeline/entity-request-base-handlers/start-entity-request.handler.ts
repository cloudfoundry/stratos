import { StartRequestAction } from '../../types/request.types';
import { StartEntityRequestHandler } from '../entity-request-pipeline.types';

export const startEntityHandler: StartEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType,
  action
) => {
  const entityAction = catalogueEntity.getRequestAction('start', requestType);
  actionDispatcher(new StartRequestAction(action, requestType));
  actionDispatcher(entityAction);
};
