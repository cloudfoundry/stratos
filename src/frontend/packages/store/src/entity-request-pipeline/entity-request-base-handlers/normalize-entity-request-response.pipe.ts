import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity';
import { MultiEndpointResponse } from './handle-multi-endpoints.pipe';

// TODO: Type the output of this pipe. #3976
export const normalizeEntityPipeFactory = (catalogEntity: StratosBaseCatalogEntity, schemaKey?: string) => {
  return (responseData: MultiEndpointResponse<any>) => {
    return {
      normalizedEntities: catalogEntity.getNormalizedEntityData(responseData.entities, schemaKey),
      endpointGuid: responseData.endpointGuid,
      totalResults: responseData.totalResults,
      totalPages: responseData.totalPages
    };
  };
};
