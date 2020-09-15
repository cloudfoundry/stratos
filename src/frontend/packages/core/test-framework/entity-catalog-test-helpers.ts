import { entityCatalog } from '../../store/src/entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from '../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogEntityConfig } from '../../store/src/entity-catalog/entity-catalog.types';

export interface EntityCatalogHelperConfig {
  catalogEntities?: [EntityCatalogEntityConfig, StratosBaseCatalogEntity][];
}

export class EntityCatalogTestHelper {
  private catalogEntitiesMap = new Map<string, StratosBaseCatalogEntity>();
  constructor(public spyOn: (object: any, method: keyof any) => jasmine.Spy, helperConfig: EntityCatalogHelperConfig) {
    helperConfig.catalogEntities.forEach(([config, entity]) => {
      const key = this.stringifyEntityConfig(config);
      this.catalogEntitiesMap.set(key, entity);
    });
  }
  private fakeGetEntity = (
    endpointTypeOrConfig: string | EntityCatalogEntityConfig,
    entityType?: string,
    subType?: string
  ) => {
    const config = typeof endpointTypeOrConfig === 'string' ? {
      endpointType: endpointTypeOrConfig,
      entityType,
      subType
    } : endpointTypeOrConfig;
    const key = this.stringifyEntityConfig(config);
    return this.catalogEntitiesMap.get(key);
  }
  private stringifyEntityConfig(config: EntityCatalogEntityConfig) {
    const baseString = `${config.endpointType}-${config.entityType}`;
    return `${baseString}${config.schemaKey ? '-' + config.schemaKey : ''}${config.subType ? '-' + config.subType : ''}`;
  }
  public mockGetEntityResponses() {
    return this.spyOn(entityCatalog, 'getEntity').and.callFake(this.fakeGetEntity);
  }
}
