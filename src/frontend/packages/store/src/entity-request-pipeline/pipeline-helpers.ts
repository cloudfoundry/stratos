import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { HttpParams } from '@angular/common/http';
import { JetstreamResponse, PagedJetstreamResponse } from './entity-request-pipeline.types';

export function getSuccessMapper(catalogueEntity: StratosBaseCatalogueEntity) {
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
  if (typeof definition.successfulRequestDataMapper === 'string') {
    return null;
  }
  return definition.successfulRequestDataMapper || definition.endpoint.globalSuccessfulRequestDataMapper || null;
}

export function mergeHttpParams(params1: HttpParams, params2: HttpParams) {
  return params1.keys().reduce((allParams, paramKey) => {
    // This does not allow for multiple params of the same type. This might become a problem.
    return allParams.set(paramKey, params1.get(paramKey));
  }, params2);
}

export function singleRequestToPaged(response: JetstreamResponse<any>): PagedJetstreamResponse {
  if (!response) {
    return null;
  }
  return Object.keys(response).reduce((mapped, endpointKey) => {
    return {
      ...mapped,
      [endpointKey]: [response[endpointKey]]
    };
  }, {});
}
