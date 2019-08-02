import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';
import { WrapperRequestActionFailed } from '../../types/request.types';
import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
// This might not be needed
export const failedEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType,
  action,
  recursivelyDeleting
) => {
  const entityAction = catalogueEntity.getRequestAction('failure', requestType);
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionFailed('Api Request Failed', action, requestType));
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
