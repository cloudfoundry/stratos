import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';

export const normalizeEntityPipe = (catalogueEntity: StratosBaseCatalogueEntity, responseData: any, schemaKey?: string) => {
  return catalogueEntity.getNormalizedEntityData(responseData, schemaKey);
};
