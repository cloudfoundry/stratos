/// <reference types="vite" />
import type { Action } from '@ngrx/store';

import type { IRequestEntityTypeState } from '../app-state';
import { STRATOS_ENDPOINT_TYPE } from '../helpers/stratos-entity-factory';
import type { ExtraApiReducers } from '../reducers/api-request-reducers.generator.helpers';
import type { ICurrentUserRolesState } from '../types/current-user-roles.types';
import type { OrchestratedActionBuilders } from './action-orchestrator/action-orchestrator';
import {
  StratosBaseCatalogEntity,
  type StratosCatalogEndpointEntity,
  type StratosCatalogEntity,
} from './entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogHelpers } from './entity-catalog.helper';
import type { EntityCatalogEntityConfig, IEntityMetadata, IStratosBaseEntityDefinition } from './entity-catalog.types';

// Debug logging configuration - can be enabled via window.__STRATOS_ENTITY_CATALOG_DEBUG__
interface EntityCatalogDebugConfig {
  enabled: boolean;
  logLookups: boolean;
  logRegistrations: boolean;
  logMissingEntities: boolean;
}

// Type guard for window debug config
function isDebugConfig(obj: unknown): obj is {
  logLookups?: boolean;
  logRegistrations?: boolean;
  logMissingEntities?: boolean;
} {
  return obj !== null && typeof obj === 'object';
}

function getDebugConfig(): EntityCatalogDebugConfig {
  const windowConfig = (window as unknown as Record<string, unknown>).__STRATOS_ENTITY_CATALOG_DEBUG__;
  if (windowConfig && isDebugConfig(windowConfig)) {
    return {
      enabled: true,
      logLookups: windowConfig.logLookups !== false,
      logRegistrations: windowConfig.logRegistrations !== false,
      logMissingEntities: windowConfig.logMissingEntities !== false,
    };
  }
  return {
    enabled: false,
    logLookups: false,
    logRegistrations: false,
    logMissingEntities: false,
  };
}

export class EntityCatalog {
  protected entities: Map<string, StratosCatalogEntity> = new Map();
  protected endpoints: Map<string, StratosCatalogEndpointEntity> = new Map();
  private debugConfig: EntityCatalogDebugConfig;
  protected lookupStats = {
    success: 0,
    failure: 0,
    failedLookups: [] as Array<{ endpoint: string; entity: string; subType?: string; timestamp: number }>
  };

  constructor() {
    this.debugConfig = getDebugConfig();
  }

  /**
   * Get diagnostic information about the current catalog state
   */
  public getDiagnostics() {
    const endpointTypes = Array.from(this.endpoints.keys());
    const entityTypes = Array.from(this.entities.keys());

    const entitiesByEndpoint = new Map<string, string[]>();
    this.entities.forEach((entity, _key) => {
      const endpointType = entity.definition.endpoint?.type || 'unknown';
      if (!entitiesByEndpoint.has(endpointType)) {
        entitiesByEndpoint.set(endpointType, []);
      }
      entitiesByEndpoint.get(endpointType).push(entity.definition.type);
    });

    return {
      summary: {
        totalEndpoints: this.endpoints.size,
        totalEntities: this.entities.size,
        lookupSuccessRate: this.lookupStats.success + this.lookupStats.failure > 0
          ? `${((this.lookupStats.success / (this.lookupStats.success + this.lookupStats.failure)) * 100).toFixed(2)}%`
          : 'N/A'
      },
      registeredEndpoints: endpointTypes,
      registeredEntities: entityTypes,
      entitiesByEndpoint: Object.fromEntries(entitiesByEndpoint),
      lookupStats: {
        ...this.lookupStats,
        recentFailures: this.lookupStats.failedLookups.slice(-10)
      }
    };
  }

  /**
   * Validate catalog state and report potential issues
   */
  public validateCatalog(): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if catalog is empty
    if (this.endpoints.size === 0 && this.entities.size === 0) {
      errors.push('Entity catalog is completely empty - no endpoints or entities registered');
    }

    // Check for entities without corresponding endpoints
    const endpointTypeSet = new Set(
      Array.from(this.endpoints.values()).map(ep => ep.definition.type)
    );

    // Group entities by endpoint type for better diagnostics
    const entitiesByEndpoint = new Map<string, string[]>();

    this.entities.forEach((entity, _key) => {
      const endpointType = entity.definition.endpoint?.type;
      if (endpointType && endpointType !== STRATOS_ENDPOINT_TYPE && !endpointTypeSet.has(endpointType)) {
        if (!entitiesByEndpoint.has(endpointType)) {
          entitiesByEndpoint.set(endpointType, []);
        }
        entitiesByEndpoint.get(endpointType).push(entity.definition.type);
      }
    });

    // Create consolidated warnings with entity counts
    entitiesByEndpoint.forEach((entityTypes, endpointType) => {
      warnings.push(
        `${entityTypes.length} entities reference endpoint type '${endpointType}' which is not registered: ${entityTypes.join(', ')}`
      );
    });

    // Check for common missing endpoint types (not entity keys)
    const commonEndpoints = ['cf', 'k8s', 'metrics'];
    const registeredCommon = commonEndpoints.filter(ep => endpointTypeSet.has(ep));

    if (registeredCommon.length > 0 && registeredCommon.length < commonEndpoints.length) {
      const missing = commonEndpoints.filter(ep => !endpointTypeSet.has(ep));
      warnings.push(`Some common endpoint types not registered: ${missing.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Get all entities registered for a specific endpoint type
   */
  private getEntitiesForEndpoint(endpointType: string): string[] {
    const entities: string[] = [];
    this.entities.forEach((entity) => {
      const endpoint = entity.definition.endpoint;
      if (endpoint && typeof endpoint === 'object' && 'type' in endpoint && endpoint.type === endpointType) {
        entities.push(entity.definition.type);
      }
    });
    return entities;
  }

  /**
   * Create detailed error message for missing entity
   */
  private createMissingEntityError(endpointType: string, entityType: string, subType?: string): string {
    const availableEndpoints = Array.from(this.endpoints.keys());
    const entitiesForEndpoint = this.getEntitiesForEndpoint(endpointType);

    let message = `\n${'='.repeat(80)}\n`;
    message += `ENTITY CATALOG LOOKUP FAILED\n`;
    message += `${'='.repeat(80)}\n`;
    message += `Requested: endpoint='${endpointType}', entity='${entityType}'${subType ? `, subType='${subType}'` : ''}\n`;
    message += `\n`;

    // Suggest available endpoints if requested one doesn't exist
    if (!this.endpoints.has(endpointType)) {
      message += `❌ Endpoint '${endpointType}' is NOT registered\n`;
      message += `\n`;
      message += `Available endpoint types (${availableEndpoints.length}):\n`;
      if (availableEndpoints.length === 0) {
        message += `  - (none registered yet)\n`;
      } else {
        availableEndpoints.forEach(ep => {
          message += `  - ${ep}\n`;
        });
      }

      // Check for similar endpoint types
      const similar = availableEndpoints.filter(ep =>
        ep.includes(endpointType) || endpointType.includes(ep) ||
        this.levenshteinDistance(ep, endpointType) <= 2
      );
      if (similar.length > 0) {
        message += `\n`;
        message += `💡 Did you mean one of these? ${similar.join(', ')}\n`;
      }
    } else {
      message += `✅ Endpoint '${endpointType}' is registered\n`;
      message += `\n`;
      message += `❌ Entity '${entityType}' NOT found for endpoint '${endpointType}'\n`;
      message += `\n`;
      message += `Available entities for '${endpointType}' (${entitiesForEndpoint.length}):\n`;
      if (entitiesForEndpoint.length === 0) {
        message += `  - (no entities registered for this endpoint)\n`;
      } else {
        entitiesForEndpoint.forEach(ent => {
          message += `  - ${ent}\n`;
        });
      }

      // Check for similar entity types across all endpoints
      const allEntityTypes = Array.from(this.entities.values()).map(e => e.definition.type);
      const similarEntities = allEntityTypes.filter(ent =>
        ent.includes(entityType) || entityType.includes(ent) ||
        this.levenshteinDistance(ent, entityType) <= 2
      );
      if (similarEntities.length > 0) {
        message += `\n`;
        message += `💡 Similar entity types found in catalog: ${similarEntities.join(', ')}\n`;
      }
    }

    message += `\n`;
    message += `Catalog State:\n`;
    message += `  - Total endpoints: ${this.endpoints.size}\n`;
    message += `  - Total entities: ${this.entities.size}\n`;
    message += `  - Lookup success rate: ${this.lookupStats.success}/${this.lookupStats.success + this.lookupStats.failure}\n`;
    message += `\n`;
    message += `Troubleshooting:\n`;
    message += `  1. Verify the entity is registered in the appropriate entity-catalog module\n`;
    message += `  2. Check that the endpoint type string matches exactly (case-sensitive)\n`;
    message += `  3. Ensure entity generators are imported and executed during app initialization\n`;
    message += `  4. Enable debug logging: window.__STRATOS_ENTITY_CATALOG_DEBUG__ = {}\n`;
    message += `  5. Call entityCatalog.getDiagnostics() for detailed catalog state\n`;
    message += `${'='.repeat(80)}\n`;

    return message;
  }

  /**
   * Calculate Levenshtein distance for fuzzy string matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private registerEndpoint(endpoint: StratosCatalogEndpointEntity) {
    if (this.endpoints.has(endpoint.entityKey)) {
      // Suppress duplicate warnings in test environment to reduce noise
      // Test setup can cause harmless duplicate registrations
      const isTestEnv = typeof (window as unknown as Record<string, unknown>).describe !== 'undefined';
      if (!isTestEnv) {
        console.warn(`Duplicate endpoint catalog entity found. ID: ${endpoint.entityKey} - Type: ${endpoint.definition.type}`);
      }
    } else {
      this.endpoints.set(endpoint.entityKey, endpoint);
      if (this.debugConfig.enabled && this.debugConfig.logRegistrations) {
        console.log(`[EntityCatalog] Registered endpoint: ${endpoint.definition.type} (key: ${endpoint.entityKey})`);
      }
    }
  }

  private registerEntity(entity: StratosCatalogEntity) {
    if (this.entities.has(entity.entityKey)) {
      const { type } = entity.definition;
      // Suppress duplicate warnings in test environment to reduce noise
      // Test setup can cause harmless duplicate registrations
      const isTestEnv = typeof (window as unknown as Record<string, unknown>).describe !== 'undefined';
      if (!isTestEnv) {
        const endpoint = entity.definition.endpoint;
        const endpointType = endpoint && typeof endpoint === 'object' && 'type' in endpoint ? endpoint.type : 'unknown';
        console.warn(
          `Duplicate catalog entity found. ID: ${entity.entityKey} - Type: ${type} - Endpoint: ${endpointType}`
        );
      }
    } else {
      this.entities.set(entity.entityKey, entity);
      if (this.debugConfig.enabled && this.debugConfig.logRegistrations) {
        const endpoint = entity.definition.endpoint;
        const endpointType = endpoint && typeof endpoint === 'object' && 'type' in endpoint ? endpoint.type : 'unknown';
        console.log(
          `[EntityCatalog] Registered entity: ${entity.definition.type} for endpoint ${endpointType} (key: ${entity.entityKey})`
        );
      }
    }
  }

  private getEntityOfType(
    entityType: string,
    endpointType?: string
  ) {
    const id = endpointType ? this.getEntityKey(endpointType, entityType) : entityType;

    // For endpoint entities, check both endpoints and entities maps
    // STRATOS_ENDPOINT_TYPE is a special case for internal entities
    if (endpointType !== STRATOS_ENDPOINT_TYPE && entityType === EntityCatalogHelpers.endpointType) {
      // First try the endpoints map (for true endpoint entities)
      const endpointEntity = this.endpoints.get(id);
      if (endpointEntity) {
        return endpointEntity;
      }

      // Fallback: Some "endpoint" type entities are registered in the entities map
      // This occurs when the entity definition has an 'endpoint' property set,
      // making isEndpoint=false (see StratosBaseCatalogEntity constructor line 76)
      const regularEntity = this.entities.get(id);
      if (regularEntity && this.debugConfig.enabled && this.debugConfig.logLookups) {
        console.log(
          `[EntityCatalog] Found endpoint entity '${entityType}' for '${endpointType}' in entities map (not endpoints map)`
        );
      }
      return regularEntity;
    }

    return this.entities.get(id);
  }

  private getEntitySubType(entity: StratosBaseCatalogEntity, subtypeType: string): StratosBaseCatalogEntity | null {
    const subTypes = entity.definition.subTypes as IStratosBaseEntityDefinition[] | undefined;
    if (!subTypes || !Array.isArray(subTypes)) {
      return null;
    }
    const subtype = subTypes.find(subType => subType && typeof subType === 'object' && 'type' in subType && subType.type === subtypeType);
    if (!subtype) {
      return null;
    }
    const definition = entity.definition;
    const {
      subTypes: _omitted,
      ...parent
    } = definition;
    // Ensure the subtype inherits parent
    return new StratosBaseCatalogEntity({
      ...parent,
      ...subtype,
      parentType: parent.type
    }, { ...entity.builders });
  }

  private getConfig(
    endpointTypeOrConfig: string | EntityCatalogEntityConfig,
    entityType?: string,
    subType?: string
  ): EntityCatalogEntityConfig {
    // Check if it's a config object
    if (typeof endpointTypeOrConfig === 'object' &&
        endpointTypeOrConfig !== null &&
        'entityType' in endpointTypeOrConfig) {
      return endpointTypeOrConfig;
    }
    // Otherwise treat as string parameters
    return {
      endpointType: endpointTypeOrConfig as string,
      entityType: entityType ?? null,
      subType: subType ?? null
    };
  }

  public register(entity: StratosBaseCatalogEntity) {
    if (this.debugConfig.enabled && this.debugConfig.logRegistrations) {
      console.log(
        `[EntityCatalog] Registering ${entity.endpointType} entity: ${entity.definition.type}, ` +
        `isEndpoint=${entity.isEndpoint}, endpointType=${entity.endpointType}`
      );
    }

    if (entity.isEndpoint) {
      this.registerEndpoint(entity as StratosCatalogEndpointEntity);
    } else {
      // We could auto register endpoints found in entities
      this.registerEntity(entity as StratosCatalogEntity);
    }
  }

  // Overload: Returns typed entity when generic parameters provided
  public getEntityFromKey<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(entityKey: string): StratosBaseCatalogEntity<T, Y, AB, AB> | undefined;
  // Overload: Returns unknown when used without explicit types
  public getEntityFromKey(entityKey: string): StratosBaseCatalogEntity | undefined;
  // Implementation
  public getEntityFromKey<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(entityKey: string): StratosBaseCatalogEntity<T, Y, AB, AB> | undefined {
    const entity = this.entities.get(entityKey) || this.endpoints.get(entityKey);
    return entity as StratosBaseCatalogEntity<T, Y, AB, AB> | undefined;
  }

  // Overload: Typed entity with config object
  public getEntity<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(
    entityConfig: EntityCatalogEntityConfig
  ): StratosBaseCatalogEntity<T, Y, AB, AB> | null;
  // Overload: Typed entity with string parameters
  public getEntity<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders,
    >(
      endpointType: string,
      entityType: string,
      subType?: string
    ): StratosBaseCatalogEntity<T, Y, AB, AB> | null;
  // Overload: Untyped entity with config (returns base type)
  public getEntity(
    entityConfig: EntityCatalogEntityConfig
  ): StratosBaseCatalogEntity | null;
  // Overload: Untyped entity with string parameters (returns base type)
  public getEntity(
    endpointType: string,
    entityType: string,
    subType?: string
  ): StratosBaseCatalogEntity | null;
  // Implementation
  public getEntity<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders,
    >(
      endpointTypeOrConfig: string | EntityCatalogEntityConfig,
      entityType?: string,
      subType?: string
    ): StratosBaseCatalogEntity<T, Y, AB, AB> | null {
    try {
      const config = this.getConfig(endpointTypeOrConfig, entityType, subType);

      if (this.debugConfig.enabled && this.debugConfig.logLookups) {
        console.log(
          `[EntityCatalog] Looking up: endpoint='${config.endpointType}', entity='${config.entityType}'${config.subType ? `, subType='${config.subType}'` : ''}`
        );
      }

      const entityOfType = this.getEntityOfType(config.entityType, config.endpointType);

      // Handle subtype lookup
      if (entityOfType && config.subType) {
        const entitySubType = this.getEntitySubType(entityOfType, config.subType);
        if (!entitySubType) {
          this.lookupStats.failure++;
          this.lookupStats.failedLookups.push({
            endpoint: config.endpointType,
            entity: config.entityType,
            subType: config.subType,
            timestamp: Date.now()
          });

          if (this.debugConfig.enabled && this.debugConfig.logMissingEntities) {
            console.warn(this.createMissingEntityError(config.endpointType, config.entityType, config.subType));
          } else {
            console.warn(
              `Missing catalog subtype: endpoint='${config.endpointType}', entity='${config.entityType}', subType='${config.subType}'`
            );
          }
        } else {
          this.lookupStats.success++;
          if (this.debugConfig.enabled && this.debugConfig.logLookups) {
            console.log(`[EntityCatalog] ✅ Found subtype entity`);
          }
        }
        return entitySubType as StratosBaseCatalogEntity<T, Y, AB, AB>;
      }

      // Handle entity not found
      if (!entityOfType) {
        this.lookupStats.failure++;
        this.lookupStats.failedLookups.push({
          endpoint: config.endpointType,
          entity: config.entityType,
          subType: config.subType,
          timestamp: Date.now()
        });

        // Provide detailed error message when debug is enabled or when it's the first few failures
        if (this.debugConfig.enabled && this.debugConfig.logMissingEntities) {
          console.warn(this.createMissingEntityError(config.endpointType, config.entityType, config.subType));
        } else if (this.lookupStats.failure <= 5) {
          // For first few failures without debug mode, provide a hint about enabling debug
          console.warn(
            `Missing catalog entity: endpoint='${config.endpointType}', entity='${config.entityType}'${config.subType ? `, subType='${config.subType}'` : ''}`,
            `\nℹ️  Enable detailed diagnostics with: window.__STRATOS_ENTITY_CATALOG_DEBUG__ = {}`
          );
        } else {
          // Use concise warning after several failures to reduce console noise
          console.warn(
            `Missing catalog entity: endpoint='${config.endpointType}', entity='${config.entityType}'${config.subType ? `, subType='${config.subType}'` : ''}`
          );
        }
      } else {
        this.lookupStats.success++;
        if (this.debugConfig.enabled && this.debugConfig.logLookups) {
          console.log(`[EntityCatalog] ✅ Found entity`);
        }
      }

      return entityOfType as StratosBaseCatalogEntity<T, Y, AB, AB>;
    } catch (error) {
      this.lookupStats.failure++;
      console.error(
        `Error getting catalog entity: endpoint='${endpointTypeOrConfig}', entity='${entityType}'`,
        error
      );
      return null;
    }
  }

  public getEntityKey(endpointType: string, entityType: string): string;
  public getEntityKey(entityConfig: EntityCatalogEntityConfig): string;
  public getEntityKey(endpointTypeOrConfig: string | EntityCatalogEntityConfig, entityType?: string): string {
    const config = this.getConfig(endpointTypeOrConfig, entityType);
    if (config && config.entityType) {
      return EntityCatalogHelpers.buildEntityKey(config.entityType, config.endpointType ?? '');
    }
    return EntityCatalogHelpers.buildEntityKey(entityType ?? '', endpointTypeOrConfig as string);
  }

  // Overload: Typed endpoint entity
  public getEndpoint<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(endpointType: string, subType?: string): StratosCatalogEndpointEntity<T, Y, AB, AB> | null;
  // Overload: Untyped endpoint entity (returns base type)
  public getEndpoint(endpointType: string, subType?: string): StratosCatalogEndpointEntity | null;
  // Implementation
  public getEndpoint<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(endpointType: string, subType?: string): StratosCatalogEndpointEntity<T, Y, AB, AB> | null {
    return this.getEntity<T, Y, AB>(
      endpointType,
      EntityCatalogHelpers.endpointType,
      subType
    ) as StratosCatalogEndpointEntity<T, Y, AB, AB> | null;
  }

  // Overload: Typed entities for endpoint
  public getAllEntitiesForEndpointType<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(endpointType: string): StratosCatalogEntity<T, Y, AB, AB>[];
  // Overload: Untyped entities for endpoint (returns base type)
  public getAllEntitiesForEndpointType(endpointType: string): StratosCatalogEntity[];
  // Implementation
  public getAllEntitiesForEndpointType<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(endpointType: string): StratosCatalogEntity<T, Y, AB, AB>[] {
    return this.getAllEntitiesTypes<T, Y, AB>().filter(entity => {
      const endpoint = entity.definition.endpoint;
      return endpoint && typeof endpoint === 'object' && 'type' in endpoint && endpoint.type === endpointType;
    });
  }

  // Overload: Typed entities
  public getAllEntitiesTypes<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(): StratosCatalogEntity<T, Y, AB, AB>[];
  // Overload: Untyped entities (returns base type)
  public getAllEntitiesTypes(): StratosCatalogEntity[];
  // Implementation
  public getAllEntitiesTypes<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(): StratosCatalogEntity<T, Y, AB, AB>[] {
    return Array.from(this.entities.values()) as StratosCatalogEntity<T, Y, AB, AB>[];
  }

  // Overload: Typed endpoint entities
  public getAllBaseEndpointTypes<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(): StratosCatalogEndpointEntity<T, Y, AB, AB>[];
  // Overload: Untyped endpoint entities (returns base type)
  public getAllBaseEndpointTypes(): StratosCatalogEndpointEntity<IEntityMetadata, unknown, OrchestratedActionBuilders, OrchestratedActionBuilders>[];
  // Implementation
  public getAllBaseEndpointTypes<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(): StratosCatalogEndpointEntity<T, Y, AB, AB>[] {
    return Array.from(this.endpoints.values()) as unknown as StratosCatalogEndpointEntity<T, Y, AB, AB>[];
  }

  // Overload: Typed endpoint entities
  public getAllEndpointTypes<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(techPreviewEnabled?: boolean): StratosCatalogEndpointEntity<T, Y, AB, AB>[];
  // Overload: Untyped endpoint entities (returns base type)
  public getAllEndpointTypes(techPreviewEnabled?: boolean): StratosCatalogEndpointEntity<IEntityMetadata, unknown, OrchestratedActionBuilders, OrchestratedActionBuilders>[];
  // Implementation
  public getAllEndpointTypes<
    T extends IEntityMetadata = IEntityMetadata,
    Y = unknown,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(techPreviewEnabled = false): StratosCatalogEndpointEntity<T, Y, AB, AB>[] {
    try {
      const baseEndpoints = Array.from(this.endpoints.values())
        .filter(item => !item.definition.techPreview || item.definition.techPreview && techPreviewEnabled);
      return baseEndpoints.reduce((allEndpoints, baseEndpoint) => {
        allEndpoints.push(baseEndpoint as unknown as StratosCatalogEndpointEntity<T, Y, AB, AB>);
        const subTypes = baseEndpoint.definition.subTypes;
        if (subTypes && Array.isArray(subTypes)) {
          subTypes.forEach(subType => {
            try {
              if (subType && typeof subType === 'object' && 'type' in subType) {
                const endpoint = this.getEndpoint<T, Y, AB>(baseEndpoint.definition.type, subType.type);
                if (endpoint) {
                  allEndpoints.push(endpoint);
                }
              }
            } catch (error) {
              const subTypeName = subType && typeof subType === 'object' && 'type' in subType ? subType.type : 'unknown';
              console.warn(`Error getting endpoint subtype: ${baseEndpoint.definition.type}/${subTypeName}`, error);
            }
          });
        }
        return allEndpoints;
      }, [] as StratosCatalogEndpointEntity<T, Y, AB, AB>[]);
    } catch (error) {
      console.error('Error getting all endpoint types:', error);
      return [];
    }
  }

  public getAllEntityRequestDataReducers() {
    const entities = this.getAllEntitiesTypes();
    const endpoints = this.getAllEndpointTypes();
    return [...entities, ...endpoints].reduce((allEntityReducers, entity) => {
      if (entity.entityKey && entity.builders.dataReducers && entity.builders.dataReducers.length) {
        return {
          ...allEntityReducers,
          [entity.entityKey]: entity.builders.dataReducers
        };
      }
      return allEntityReducers;
    }, {} as ExtraApiReducers<IRequestEntityTypeState<unknown>>);
  }

  public getAllCurrentUserReducers(state: ICurrentUserRolesState, action: Action): ICurrentUserRolesState {
    const endpoints = this.getAllEndpointTypes();
    let oneChanged = false;
    endpoints.forEach(endpoint => {
      if (endpoint.definition.userRolesReducer) {
        const endpointState = endpoint.definition.userRolesReducer(state.endpoints[endpoint.type], action);
        oneChanged = oneChanged || !!endpointState;
        if (endpointState) {
          state = {
            ...state,
            endpoints: {
              ...state.endpoints,
              [endpoint.type]: endpointState
            }
          };
        }
      }
    });
    return oneChanged ? {
      ...state
    } : state;
  }
}

// Only to be used for tests
export class TestEntityCatalog extends EntityCatalog {
  public clear() {
    this.endpoints.clear();
    this.entities.clear();
    this.lookupStats = {
      success: 0,
      failure: 0,
      failedLookups: []
    };
  }
}

// FIXME: This shouldn't make it into the production code. It's quite the anti pattern but fixes the tests for the time being.
// https://github.com/cloudfoundry-incubator/stratos/issues/3753 - Reverting the entity catalog to an Angular service
// makes testing much easier and remove the need for this.
/* tslint:disable-next-line:no-string-literal  */
// Detect test environment (Karma or Vitest)
// Note: We check for test globals without importing test dependencies to avoid bundling test code
const isTestEnvironment = (typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).__karma__) ||
                          (typeof window !== 'undefined' && typeof (window as unknown as Record<string, unknown>).describe === 'function') ||
                          (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test');
export const entityCatalog: EntityCatalog = isTestEnvironment ? new TestEntityCatalog() : new EntityCatalog();

// Expose diagnostics globally for debugging
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__STRATOS_ENTITY_CATALOG__ = {
    getDiagnostics: () => entityCatalog.getDiagnostics(),
    validateCatalog: () => entityCatalog.validateCatalog(),
    enableDebug: (config?: Partial<EntityCatalogDebugConfig>) => {
      (window as unknown as Record<string, unknown>).__STRATOS_ENTITY_CATALOG_DEBUG__ = {
        logLookups: true,
        logRegistrations: true,
        logMissingEntities: true,
        ...config
      };
      console.log('Entity Catalog debug mode enabled. Reload the application to see debug logs.');
    },
    disableDebug: () => {
      delete (window as unknown as Record<string, unknown>).__STRATOS_ENTITY_CATALOG_DEBUG__;
      console.log('Entity Catalog debug mode disabled.');
    }
  };
}
