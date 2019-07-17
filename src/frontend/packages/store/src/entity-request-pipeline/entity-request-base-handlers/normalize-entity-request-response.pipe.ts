import { StratosCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';

export const normalizeEntityPipeFactory = (catalogueEntity: StratosCatalogueEntity, schemaKey?: string) => {
  return (responseData: any) => {
    return catalogueEntity.getNormalizedEntityData(responseData, schemaKey);
  };
};
