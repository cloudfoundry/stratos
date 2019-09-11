import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { WrapperRequestActionFailed } from '../../types/request.types';
import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';

// This might not be needed
export const failedEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType,
  action,
  recursivelyDeleting
) => {
  const entityAction = catalogueEntity.getRequestAction('failure', requestType, action);
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionFailed('Api Request Failed', action, requestType));
  if (recursivelyDeleting && recursivelyDeleting.response) {
    actionDispatcher(
      new RecursiveDeleteFailed(
        action.guid,
        action.endpointGuid,
        catalogueEntity.getSchema(action.schemaKey)
      ),
    );
  }
};
