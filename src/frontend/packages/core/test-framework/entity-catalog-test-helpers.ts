import { StratosBaseCatalogEntity, entityCatalog, EntityCatalogEntityConfig} from '@stratosui/store';
import { vi } from 'vitest';

export interface EntityCatalogHelperConfig {
  catalogEntities?: [EntityCatalogEntityConfig, StratosBaseCatalogEntity][];
}

// Subset of the config shape this helper actually reads; entityType/subType
// may be absent when built from the positional getEntity(endpointType, ...) form.
type EntityConfigKeyParts = {
  endpointType?: string;
  entityType?: string;
  schemaKey?: string;
  subType?: string;
};

export class EntityCatalogTestHelper {
  private catalogEntitiesMap = new Map<string, StratosBaseCatalogEntity>();
  constructor(public spyOn: typeof vi.spyOn, helperConfig: EntityCatalogHelperConfig) {
    helperConfig.catalogEntities?.forEach(([config, entity]) => {
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
  private stringifyEntityConfig(config: EntityConfigKeyParts) {
    const baseString = `${config.endpointType}-${config.entityType}`;
    return `${baseString}${config.schemaKey ? '-' + config.schemaKey : ''}${config.subType ? '-' + config.subType : ''}`;
  }
  public mockGetEntityResponses() {
    const spy = vi.spyOn(entityCatalog, 'getEntity');
    // strict: getEntity's public overloads declare a non-null return, but the real
    // implementation (and so this faithful mock) returns undefined on a catalog miss.
    // Cast the nullable mock onto the spy's non-null overload signature.
    return spy.mockImplementation(this.fakeGetEntity as unknown as typeof entityCatalog.getEntity);
  }
}
