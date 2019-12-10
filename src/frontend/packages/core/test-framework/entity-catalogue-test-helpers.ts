import { StratosBaseCatalogueEntity } from '../..store/src/entity-catalog/entity-catalogue-entity';
import { entityCatalogue } from '../../store/src/entity-catalog/entity-catalogue.service';
import { EntityCatalogueEntityConfig } from '../../store/src/entity-catalog/entity-catalogue.types';

export interface EntityCatalogueHelperConfig {
  catalogueEntities?: [EntityCatalogueEntityConfig, StratosBaseCatalogueEntity][];
}

export class EntityCatalogueTestHelper {
  private catalogueEntitiesMap = new Map<string, StratosBaseCatalogueEntity>();
  constructor(public spyOn: (object: any, method: keyof any) => jasmine.Spy, helperConfig: EntityCatalogueHelperConfig) {
    helperConfig.catalogueEntities.forEach(([config, entity]) => {
      const key = this.stringifyEntityConfig(config);
      this.catalogueEntitiesMap.set(key, entity);
    });
  }
  private fakeGetEntity = (
    endpointTypeOrConfig: string | EntityCatalogueEntityConfig,
    entityType?: string,
    subType?: string
  ) => {
    const config = typeof endpointTypeOrConfig === 'string' ? {
      endpointType: endpointTypeOrConfig,
      entityType,
      subType
    } : endpointTypeOrConfig;
    const key = this.stringifyEntityConfig(config);
    return this.catalogueEntitiesMap.get(key);
  }
  private stringifyEntityConfig(config: EntityCatalogueEntityConfig) {
    const baseString = `${config.endpointType}-${config.entityType}`;
    return `${baseString}${config.schemaKey ? '-' + config.schemaKey : ''}${config.subType ? '-' + config.subType : ''}`;
  }
  public mockGetEntityResponses() {
    return this.spyOn(entityCatalogue, 'getEntity').and.callFake(this.fakeGetEntity);
  }
}
