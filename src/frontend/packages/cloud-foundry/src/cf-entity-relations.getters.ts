import { EntityRequestAction } from '../../store/src/types/request.types';
import { EntityInlineParentAction } from './entity-relations/entity-relations.types';
import { listEntityRelations } from './entity-relations/entity-relations';
import { PaginatedAction } from '../../store/src/types/pagination.types';
import { entityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../core/src/core/entity-catalogue/entity-catalogue.types';
import { isEntityInlineParentAction } from './entity-relations/entity-relation-tree.helpers';
import { HttpRequest, HttpParams } from '@angular/common/http';

export function getEntityRelationsForEntityRequest(action: EntityRequestAction) {
  return listEntityRelations(
    action as EntityInlineParentAction,
  );
}

export function getEntityRelationsForPaginationRequest(action: PaginatedAction) {
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
    action as (EntityInlineParentAction & PaginatedAction)
  );
}

export function addRelationParams(request: HttpRequest<any>, action: EntityRequestAction | PaginatedAction) {
  if (!isEntityInlineParentAction(action)) {
    return request;
  }
  const paginationAction = action as PaginatedAction;
  // TODO This should decide which method to use getEntityRelationsForPaginationRequest or getEntityRelationsForEntityRequest
  const relationInfo = paginationAction.paginationKey ?
    getEntityRelationsForPaginationRequest(paginationAction) : getEntityRelationsForEntityRequest(action);
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

