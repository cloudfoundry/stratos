import { ClearPaginationOfEntity, ClearPaginationOfType } from '../../actions/pagination.actions';
import { RecursiveDeleteComplete } from '../../effects/recursive-entity-delete.effect';
import { WrapperRequestActionSuccess } from '../../types/request.types';
import { SucceedOrFailEntityRequestHandler } from '../entity-request-pipeline.types';

export const successEntityHandler: SucceedOrFailEntityRequestHandler = (
  actionDispatcher,
  catalogueEntity,
  requestType,
  action,
  result,
  recursivelyDeleting
) => {
  const entityAction = catalogueEntity.getRequestAction('success', requestType, action, result.response);
  if (
    !action.updatingKey &&
    (requestType === 'create' || requestType === 'delete')
  ) {
    // FIXME: Look at using entity config instead of actions in these actions ctors
    if (action.removeEntityOnDelete) {
      actionDispatcher(new ClearPaginationOfEntity(action, action.guid));
    } else {
      if (action.proxyPaginationEntityConfig) {
        actionDispatcher(new ClearPaginationOfType(action.proxyPaginationEntityConfig));
      } else {
        actionDispatcher(new ClearPaginationOfType(action));
      }
    }

    if (Array.isArray(action.clearPaginationEntityKeys)) {
      // If clearPaginationEntityKeys is an array then clear the pagination sections regardless of removeEntityOnDelete
      action.clearPaginationEntityKeys.map(key => actionDispatcher(new ClearPaginationOfType(action)));
    }
  }
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionSuccess(result.response, action, requestType, result.totalResults, result.totalPages));
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
