import { Action } from '@ngrx/store';

import { ClearPaginationOfEntity, ClearPaginationOfType } from '../../actions/pagination.actions';
import { RecursiveDeleteComplete } from '../../effects/recursive-entity-delete.effect';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { EntityRequestAction, WrapperRequestActionSuccess } from '../../types/request.types';
import { PipelineResult } from '../entity-request-pipeline.types';


export function successEntityHandler(
  actionDispatcher: (actionToDispatch: Action) => void,
  catalogEntity: StratosBaseCatalogEntity,
  requestType: ApiRequestTypes,
  action: EntityRequestAction,
  result: PipelineResult,
  recursivelyDeleting = false
) {
  const entityAction = catalogEntity.getRequestAction('success', action, requestType, result.response);
  if (
    !action.updatingKey &&
    (requestType === 'create' || requestType === 'delete')
  ) {
    const proxySafeEntityConfig = action.proxyPaginationEntityConfig ? action.proxyPaginationEntityConfig : action;
    // FIXME: Look at using entity config instead of actions in these actions ctors #3975
    if (action.removeEntityOnDelete) {
      actionDispatcher(new ClearPaginationOfEntity(proxySafeEntityConfig, action.guid));
    } else {
      actionDispatcher(new ClearPaginationOfType(proxySafeEntityConfig));
    }

    if (Array.isArray(action.clearPaginationEntityKeys)) {
      // If clearPaginationEntityKeys is an array then clear the pagination sections regardless of removeEntityOnDelete
      action.clearPaginationEntityKeys.forEach(key => {
        const entityConfig = entityCatalog.getEntity(action.endpointType, key);
        actionDispatcher(new ClearPaginationOfType(entityConfig.getSchema()));
      });
    }
  }
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionSuccess(result.response, action, requestType, result.totalResults, result.totalPages));
  if (recursivelyDeleting) {
    actionDispatcher(
      new RecursiveDeleteComplete(
        action.guid,
        action.endpointGuid,
        catalogEntity.getSchema(action.schemaKey)
      ),
    );
  }
}
