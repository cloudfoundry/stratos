import { StratosBaseCatalogEntity } from '../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IStratosEntityDefinition } from '../entity-catalog/entity-catalog.types';
import { JetstreamResponse, PagedJetstreamResponse } from './entity-request-pipeline.types';

export function isJetstreamRequest(definition: IStratosEntityDefinition): boolean {
  return !definition.nonJetstreamRequest && !definition.nonJetstreamRequestHandler;
}

export function getSuccessMapper(catalogEntity: StratosBaseCatalogEntity) {
  const definition = catalogEntity.definition as IStratosEntityDefinition;
  if (typeof definition.successfulRequestDataMapper === 'string') {
    return null;
  }
  return definition.successfulRequestDataMapper || definition.endpoint.globalSuccessfulRequestDataMapper || null;
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
