import { HttpRequest } from '@angular/common/http';

import { entityCatalogue } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../core/src/core/entity-catalogue/entity-catalogue.types';
import { isPaginatedAction, PaginatedAction } from '../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../store/src/types/request.types';
import { isEntityInlineParentAction } from './entity-relations/entity-relation-tree.helpers';
import { listEntityRelations } from './entity-relations/entity-relations';
import { EntityInlineParentAction } from './entity-relations/entity-relations.types';

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

export function addRelationParams(request: HttpRequest<any>, action: EntityRequestAction | PaginatedAction) {
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

