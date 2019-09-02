import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { MultiEndpointResponse } from './handle-multi-endpoints.pipe';

// TODO: Type the output of this pipe.
export const normalizeEntityPipeFactory = (catalogueEntity: StratosBaseCatalogueEntity, schemaKey?: string) => {
  return (responseData: MultiEndpointResponse<any>) => {
    return {
      normalizedEntities: catalogueEntity.getNormalizedEntityData(responseData.entities, schemaKey),
      endpointGuid: responseData.endpointGuid,
      totalResults: responseData.totalResults,
      totalPages: responseData.totalPages
    };
  };
};
