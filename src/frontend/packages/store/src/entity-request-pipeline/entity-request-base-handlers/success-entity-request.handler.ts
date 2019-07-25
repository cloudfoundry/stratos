import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';
import { WrapperRequestActionSuccess } from '../../types/request.types';
import { RecursiveDeleteComplete } from '../../effects/recursive-entity-delete.effect';

export const successEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType,
  action,
  data,
  recursivelyDeleting
) => {
  const entityAction = catalogueEntity.getRequestAction('success', requestType);
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionSuccess(data, action, requestType));
  if (recursivelyDeleting) {
    this.store.dispatch(
      new RecursiveDeleteComplete(
        action.guid,
        action.endpointGuid,
        catalogueEntity.getSchema(action.schemaKey)
      ),
    );
  }
};
