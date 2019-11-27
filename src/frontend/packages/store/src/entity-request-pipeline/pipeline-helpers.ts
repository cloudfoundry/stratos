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

export function singleRequestToPaged(response: JetstreamResponse<any>, nonJetstreamRequest: boolean): PagedJetstreamResponse {
  if (!response) {
    return null;
  }
  if (nonJetstreamRequest) {
    return response;
  }
  return Object.keys(response).reduce((mapped, endpointKey) => {
    const page = response[endpointKey];
    return page ? {
      ...mapped,
      [endpointKey]: [page]
    } : mapped;
  }, {});
}
