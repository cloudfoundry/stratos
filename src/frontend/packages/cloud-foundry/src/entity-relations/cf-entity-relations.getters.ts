import { HttpParams, HttpRequest } from '@angular/common/http';

import { InternalAppState } from '../../../store/src/app-state';
import { entityCatalog } from '../../../store/src/entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from '../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import {
  getPaginationParams,
} from '../../../store/src/entity-request-pipeline/pagination-request-base-handlers/get-params.pipe';
import { selectPaginationState } from '../../../store/src/selectors/pagination.selectors';
import { isPaginatedAction, PaginatedAction, PaginationParam } from '../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { QParam } from '../shared/q-param';
import { listEntityRelations } from './entity-relations';
import { EntityInlineParentAction, isEntityInlineParentAction } from './entity-relations.types';

function getEntityRelationsForEntityRequest(action: EntityInlineParentAction & EntityRequestAction) {
  return listEntityRelations(
    action,
  );
}

function getEntityRelationsForPaginationRequest(action: EntityInlineParentAction & PaginatedAction) {
  if (action.__forcedPageEntityConfig__) {
    const entityConfig = action.__forcedPageEntityConfig__ as EntityCatalogEntityConfig;
    const catalogEntity = entityCatalog.getEntity(entityConfig.endpointType, entityConfig.entityType);
    const forcedSchema = catalogEntity.getSchema(entityConfig.schemaKey);
    const newAction = {
      ...action,
      entity: [forcedSchema],
      entityType: forcedSchema.entityType
    } as EntityRequestAction;
    return listEntityRelations(
      newAction as EntityInlineParentAction
    );
  }
  return listEntityRelations(
    action
  );
}

export function addCfRelationParams(request: HttpRequest<any>, action: EntityRequestAction | PaginatedAction) {
  const entityInlineParent = isEntityInlineParentAction(action);
  if (!entityInlineParent) {
    return request;
  }
  const paginationAction = isPaginatedAction(action);
  const relationInfo = paginationAction ?
    getEntityRelationsForPaginationRequest(paginationAction as EntityInlineParentAction & PaginatedAction) :
    getEntityRelationsForEntityRequest(entityInlineParent as EntityInlineParentAction & EntityRequestAction);
  const update = {};
  if (relationInfo.maxDepth > 0) {
    update['inline-relations-depth'] = (relationInfo.maxDepth > 2 ? 2 : relationInfo.maxDepth) + '';
  }
  if (relationInfo.relations.length) {
    update['include-relations'] = relationInfo.relations.join(',');
  }
  return request.clone({
    setParams: update
  });
}

function setQParams(requestParams: HttpParams, params: PaginationParam): HttpParams {
  // No params or no q params? Not interested
  if (!params || !params.hasOwnProperty('q')) {
    return requestParams;
  }

  // We need to create a series of q values that contain all from `requestParams` and `params`. Any that exist in `requestParams`
  // should be overwritten in `params`

  // Clear `requestParams`'s `q` and start afresh
  const initialQParams = requestParams.getAll('q') || [];
  requestParams = requestParams.delete('q');

  // We're going to _append_ all q params to the requestParams object and then any remaining initial params,
  // this ensures we 'overwrite' any existing params with new
  const qParamStrings = params.q as string[];
  requestParams = qParamStrings.reduce((newRequestParams, qParamString) => {
    // Remove obsolete param from initial set of params
    const haveInitialParam = initialQParams.findIndex(qParamStr => QParam.keyFromString(qParamString) === QParam.keyFromString(qParamStr));
    if (haveInitialParam >= 0) {
      initialQParams.splice(haveInitialParam, 1);
    }
    // Append new param we wish to keep
    return newRequestParams.append('q', qParamString);
  }, requestParams);

  // Add the rest of the initial params
  return initialQParams.reduce((newRequestParams, qParamStr) => newRequestParams.append('q', qParamStr), requestParams);
}

export function addCfQParams(
  request: HttpRequest<any>,
  action: PaginatedAction,
  catalogEntity: StratosBaseCatalogEntity,
  appState: InternalAppState): HttpRequest<any> {
  // Clear any existing
  const newParams = request.params.delete('q');

  // Add initial params from action
  const newParamsFromAction = setQParams(newParams, action.initialParams);

  // If __forcedPageEntityConfig__ has been set we're in a multi action list scenario and params should come from the base action. In this
  // instance it's the entity details from the action, not the catalogueEntity that's passed in (type of entity that we're requesting)
  const entityKey = action.__forcedPageEntityConfig__ ? entityCatalog.getEntityKey(action) : catalogEntity.entityKey;

  // Overwrite initial params with params from store
  const paginationState = selectPaginationState(entityKey, action.paginationKey)(appState);
  const paginationParams = getPaginationParams(paginationState);
  const paramsFromPagination = setQParams(newParamsFromAction, paginationParams);

  // Create a new request using the new params object
  return request.clone({
    params: paramsFromPagination
  });
}
