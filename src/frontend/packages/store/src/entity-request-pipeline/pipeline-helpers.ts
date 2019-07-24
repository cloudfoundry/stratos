import { IStratosEntityDefinition } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { StratosBaseCatalogueEntity } from '../../../core/src/core/entity-catalogue/entity-catalogue-entity';

export function getSuccessMapper(catalogueEntity: StratosBaseCatalogueEntity) {
  const definition = catalogueEntity.definition as IStratosEntityDefinition;
  return definition.successfulRequestDataMapper || definition.endpoint.globalSuccessfulRequestDataMapper || null;
}
