import { StartRequestAction } from '../../types/request.types';
import { StartEntityRequestHandler } from '../entity-request-pipeline.types';

export const startEntityHandler: StartEntityRequestHandler = (
  actionDispatcher,
  catalogEntity,
  requestType,
  action
) => {
  const entityAction = catalogEntity.getRequestAction('start', action, requestType);
  actionDispatcher(new StartRequestAction(action, requestType));
  actionDispatcher(entityAction);
};
