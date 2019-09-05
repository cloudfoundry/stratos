import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { WrapperRequestActionFailed } from '../../types/request.types';

export function failedEntityHandler(
  actionDispatcher,
  catalogueEntity,
  requestType,
  action,
  response,
  recursivelyDeleting = false
) {
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
