import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';
import { WrapperRequestActionSuccess } from '../../types/request.types';

export const successEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType,
  action,
  data,
) => {
  const entityAction = catalogueEntity.getRequestAction('success', requestType);
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionSuccess(data, action, requestType));
};
