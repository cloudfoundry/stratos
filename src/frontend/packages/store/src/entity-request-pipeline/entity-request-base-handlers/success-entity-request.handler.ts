import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';
import { WrapperRequestActionSuccess } from '../../types/request.types';
import { RecursiveDeleteComplete } from '../../effects/recursive-entity-delete.effect';
import { ClearPaginationOfEntity, ClearPaginationOfType } from '../../actions/pagination.actions';

export const successEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType,
  action,
  data,
  recursivelyDeleting
) => {
  const entityAction = catalogueEntity.getRequestAction('success', requestType);
  if (
    !action.updatingKey &&
    (requestType === 'create' || requestType === 'delete')
  ) {
    // FIXME: Look at using entity config instead of actions in these actions ctors
    if (action.removeEntityOnDelete) {
      actionDispatcher(new ClearPaginationOfEntity(action, action.guid));
    } else {
      actionDispatcher(new ClearPaginationOfType(action));
    }

    if (Array.isArray(action.clearPaginationEntityKeys)) {
      // If clearPaginationEntityKeys is an array then clear the pagination sections regardless of removeEntityOnDelete
      action.clearPaginationEntityKeys.map(key => actionDispatcher(new ClearPaginationOfType(action)));
    }
  }
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionSuccess(data, action, requestType));
  if (recursivelyDeleting) {
    actionDispatcher(
      new RecursiveDeleteComplete(
        action.guid,
        action.endpointGuid,
        catalogueEntity.getSchema(action.schemaKey)
      ),
    );
  }
};
