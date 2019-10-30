import { HttpParams } from '@angular/common/http';

import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { JetstreamResponse, PagedJetstreamResponse } from './entity-request-pipeline.types';

export function isJetstreamRequest(definition: IStratosEntityDefinition): boolean {
  return !definition.nonJetstreamRequest && !definition.nonJetstreamRequestHandler;
}


export function getSuccessMapper(catalogueEntity: StratosBaseCatalogueEntity) {
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
  if (typeof definition.successfulRequestDataMapper === 'string') {
    return null;
  }
  return definition.successfulRequestDataMapper || definition.endpoint.globalSuccessfulRequestDataMapper || null;
}

export function mergeHttpParams(params1: HttpParams, params2: HttpParams) {
  return params1.keys().reduce((allParams, paramKey) => {
    const allParamsOFKey = params1.getAll(paramKey) || [];
    if (allParamsOFKey.length > 1) {
      // There's multiple values for this param, ensure we append each one
      return allParamsOFKey.reduce((b, c) => b.append(paramKey, c), allParams);
    } else if (allParamsOFKey.length > 0) {
      return allParams.set(paramKey, allParamsOFKey[0]);
    }
    return allParams;
  }, params2);
}

export function singleRequestToPaged(response: JetstreamResponse<any>): PagedJetstreamResponse {
  if (!response) {
    return null;
  }
  return Object.keys(response).reduce((mapped, endpointKey) => {
    const page = response[endpointKey];
    return page ? {
      ...mapped,
      [endpointKey]: [page]
    } : mapped;
  }, {});
}
