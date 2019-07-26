import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { HttpParams } from '@angular/common/http';

export function getSuccessMapper(catalogueEntity: StratosBaseCatalogueEntity) {
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
  return definition.successfulRequestDataMapper || definition.endpoint.globalSuccessfulRequestDataMapper || null;
}

export function mergeHttpParams(params1: HttpParams, params2: HttpParams) {
  return params1.keys().reduce((allParams, paramKey) => {
    // This does not allow for multiple params of the same type. This might become a problem.
    return allParams.set(paramKey, params1.get(paramKey));
  }, params2);
}
