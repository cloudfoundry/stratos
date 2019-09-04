import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { WrapperRequestActionFailed } from '../../types/request.types';
import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';

export const failedEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType,
  action,
  response,
  recursivelyDeleting
) => {
  const entityAction = catalogueEntity.getRequestAction('failure', requestType, action);
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionFailed('Api Request Failed', action, requestType, null, response));
  if (recursivelyDeleting) {
    actionDispatcher(
      new RecursiveDeleteFailed(
        action.guid,
        action.endpointGuid,
        catalogueEntity.getSchema(action.schemaKey)
      ),
    );
  }
};
