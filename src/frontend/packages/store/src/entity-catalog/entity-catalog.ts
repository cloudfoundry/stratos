import { Action } from '@ngrx/store';

import { STRATOS_ENDPOINT_TYPE } from '../../../core/src/base-entity-schemas';
import { IRequestEntityTypeState } from '../app-state';
import { ExtraApiReducers } from '../reducers/api-request-reducers.generator.helpers';
import { ICurrentUserRolesState } from '../types/current-user-roles.types';
import { OrchestratedActionBuilders } from './action-orchestrator/action-orchestrator';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogHelpers } from './entity-catalog.helper';
import { EntityCatalogEntityConfig, IEntityMetadata, IStratosBaseEntityDefinition } from './entity-catalog.types';

class EntityCatalog {
  protected entities: Map<string, StratosCatalogEntity> = new Map();
  protected endpoints: Map<string, StratosCatalogEndpointEntity> = new Map();

  private registerEndpoint(endpoint: StratosCatalogEndpointEntity) {
    if (this.endpoints.has(endpoint.entityKey)) {
      console.warn(`Duplicate endpoint catalog entity found. ID: ${endpoint.entityKey} - Type: ${endpoint.definition.type}`);
    } else {
      this.endpoints.set(endpoint.entityKey, endpoint);
    }
  }

  private registerEntity(entity: StratosCatalogEntity) {
    if (this.entities.has(entity.entityKey)) {
      const { type } = entity.definition;
      console.warn(
        `Duplicate catalog entity found. ID: ${entity.entityKey} - Type: ${type} - Endpoint: ${entity.definition.endpoint.type}`
      );
    } else {
      this.entities.set(entity.entityKey, entity);
    }
  }

  private getEntityOfType(
    entityType: string,
    endpointType?: string
  ) {
    const id = endpointType ? this.getEntityKey(endpointType, entityType) : entityType;
    // STRATOS_ENDPOINT_TYPE is a special case for internal entities.
    if (endpointType !== STRATOS_ENDPOINT_TYPE && entityType === EntityCatalogHelpers.endpointType) {
      return this.endpoints.get(id);
    }
    return this.entities.get(id);
  }

  private getEntitySubType(entity: StratosBaseCatalogEntity, subtypeType: string) {
    const subTypes = entity.definition.subTypes as IStratosBaseEntityDefinition[];
    if (!subTypes) {
      return null;
    }
    const subtype = subTypes.find(subType => subType.type === subtypeType);
    if (!subtype) {
      return null;
    }
    const definition = entity.definition;
    const {
      subTypes: omitted,
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
    const config = endpointTypeOrConfig as EntityCatalogEntityConfig;
    if (!config) {
      return {
        endpointType: null,
        entityType: null,
        subType: null
      };
    }
    if (config && config.entityType) {
      return config;
    }
    return {
      endpointType: endpointTypeOrConfig as string,
      entityType,
      subType
    };
  }

  public register(entity: StratosBaseCatalogEntity) {
    if (entity.isEndpoint) {
      this.registerEndpoint(entity as StratosCatalogEndpointEntity);
    } else {
      // We could auto register endpoints found in entities
      this.registerEntity(entity as StratosCatalogEntity);
    }
  }

  public getEntityFromKey(entityKey: string) {
    return this.entities.get(entityKey) || this.endpoints.get(entityKey);
  }

  public getEntity<
    T extends IEntityMetadata = IEntityMetadata,
    Y = any,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders
  >(
    entityConfig: EntityCatalogEntityConfig
  ): StratosBaseCatalogEntity<T, Y, AB, AB>;
  public getEntity<
    T extends IEntityMetadata = IEntityMetadata,
    Y = any,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders,
    >(
      endpointType: string,
      entityType: string,
      subType?: string
    ): StratosBaseCatalogEntity<T, Y, AB, AB>;
  public getEntity<
    T extends IEntityMetadata = IEntityMetadata,
    Y = any,
    AB extends OrchestratedActionBuilders = OrchestratedActionBuilders,
    >(
      endpointTypeOrConfig: string | EntityCatalogEntityConfig,
      entityType?: string,
      subType?: string
    ): StratosBaseCatalogEntity<T, Y, AB, AB> {
    /* tslint:enable:max-line-length */
    const config = this.getConfig(endpointTypeOrConfig, entityType, subType);
    const entityOfType = this.getEntityOfType(config.entityType, config.endpointType);
    if (entityOfType && subType) {
      return this.getEntitySubType(entityOfType, subType) as StratosBaseCatalogEntity<T, Y, AB, AB>;
    }
    if (!entityOfType) {
      console.warn(
        `Could not find catalog entity for endpoint type '${config.endpointType}' and entity type '${config.entityType}'. Stack: `,
        new Error().stack
      );
    }
    return entityOfType as StratosBaseCatalogEntity<T, Y, AB, AB>;
  }

  public getEntityKey(endpointType: string, entityType: string): string;
  public getEntityKey(entityConfig: EntityCatalogEntityConfig): string;
  public getEntityKey(endpointTypeOrConfig: string | EntityCatalogEntityConfig, entityType?: string) {
    const config = this.getConfig(endpointTypeOrConfig, entityType);
    if (config && config.entityType) {
      return EntityCatalogHelpers.buildEntityKey(config.entityType, config.endpointType);
    }
    return EntityCatalogHelpers.buildEntityKey(entityType, endpointTypeOrConfig as string);
  }

  public getEndpoint(endpointType: string, subType?: string) {
    return this.getEntity(
      endpointType,
      EntityCatalogHelpers.endpointType,
      subType
    ) as StratosCatalogEndpointEntity;
  }

  public getAllEntitiesForEndpointType(endpointType: string) {
    return this.getAllEntitiesTypes().filter(entities => entities.definition.endpoint.type === endpointType);
  }

  public getAllEntitiesTypes() {
    return Array.from(this.entities.values());
  }

  public getAllBaseEndpointTypes() {
    return Array.from(this.endpoints.values());
  }

  public getAllEndpointTypes(techPreviewEnabled = false) {
    const baseEndpoints = Array.from(this.endpoints.values())
      .filter(item => !item.definition.techPreview || item.definition.techPreview && techPreviewEnabled);
    return baseEndpoints.reduce((allEndpoints, baseEndpoint) => {
      allEndpoints.push(baseEndpoint);
      if (baseEndpoint.definition.subTypes) {
        baseEndpoint.definition.subTypes.forEach(subType => {
          allEndpoints.push(this.getEndpoint(baseEndpoint.definition.type, subType.type));
        });
      }
      return allEndpoints;
    }, [] as StratosCatalogEndpointEntity[]);
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
    }, {} as ExtraApiReducers<IRequestEntityTypeState<any>>);
  }

  public getAllCurrentUserReducers(state: ICurrentUserRolesState, action: Action): ICurrentUserRolesState {
    const endpoints = this.getAllEndpointTypes();
    let oneChanged = false;
    endpoints.forEach(endpoint => {
      if (endpoint.definition.userRolesReducer) {
        const endpointState = endpoint.definition.userRolesReducer(state.endpoints[endpoint.type], action);
        oneChanged = oneChanged || !!endpointState;
        if (!!endpointState) {
          state = {
            ...state,
            endpoints: {
              ...state.endpoints,
              [endpoint.type]: endpointState
            }
          }
        }
      }
    })
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
  }
}

// FIXME: This shouldn't make it into the production code. It's quite the anti pattern but fixes the tests for the time being.
// https://github.com/cloudfoundry-incubator/stratos/issues/3753 - Reverting the entity catalog to an Angular service
// makes testing much easier and remove the need for this.
/* tslint:disable-next-line:no-string-literal  */
export const entityCatalog: EntityCatalog = !!window['__karma__'] ? new TestEntityCatalog() : new EntityCatalog();
