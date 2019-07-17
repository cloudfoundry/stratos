import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';

export const normalizeEntityPipeFactory = (catalogueEntity: StratosBaseCatalogueEntity, schemaKey?: string) => {
  return (responseData: any) => {
    console.log(catalogueEntity.entityKey, catalogueEntity.getNormalizedEntityData(responseData, schemaKey))
    return catalogueEntity.getNormalizedEntityData(responseData, schemaKey);
  };
};
