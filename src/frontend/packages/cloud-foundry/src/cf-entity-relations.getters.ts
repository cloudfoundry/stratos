import { HttpParams, HttpRequest } from '@angular/common/http';

import { StratosBaseCatalogueEntity } from '../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../core/src/core/entity-catalogue/entity-catalogue.types';
import { InternalAppState } from '../../store/src/app-state';
import {
  getPaginationParams,
} from '../../store/src/entity-request-pipeline/pagination-request-base-handlers/get-params.pipe';
import { QParam } from '../../store/src/q-param';
import { selectPaginationState } from '../../store/src/selectors/pagination.selectors';
import { isPaginatedAction, PaginatedAction, PaginationParam } from '../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../store/src/types/request.types';
import { listEntityRelations } from './entity-relations/entity-relations';
import { EntityInlineParentAction, isEntityInlineParentAction } from './entity-relations/entity-relations.types';

export function getEntityRelationsForEntityRequest(action: EntityInlineParentAction & EntityRequestAction) {
  return listEntityRelations(
    action,
  );
}

export function getEntityRelationsForPaginationRequest(action: EntityInlineParentAction & PaginatedAction) {
  if (action.__forcedPageEntityConfig__) {
    const entityConfig = action.__forcedPageEntityConfig__ as EntityCatalogueEntityConfig;
    const catalogueEntity = entityCatalogue.getEntity(entityConfig.endpointType, entityConfig.entityType);
    const forcedSchema = catalogueEntity.getSchema(entityConfig.schemaKey);
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
  // TODO This should decide which method to use getEntityRelationsForPaginationRequest or getEntityRelationsForEntityRequest
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
  catalogueEntity: StratosBaseCatalogueEntity,
  appState: InternalAppState): HttpRequest<any> {
  // Clear any existing
  const newParams = request.params.delete('q');

  // Add initial params from action
  const newParamsFromAction = setQParams(newParams, action.initialParams);

  // Overwrite initial params with params from store
  const paginationState = selectPaginationState(catalogueEntity.entityKey, action.paginationKey)(appState);
  const paginationParams = getPaginationParams(paginationState);
  const paramsFromPagination = setQParams(newParamsFromAction, paginationParams);

  // Create a new request using the new params object
  return request.clone({
    params: paramsFromPagination
  });
}
