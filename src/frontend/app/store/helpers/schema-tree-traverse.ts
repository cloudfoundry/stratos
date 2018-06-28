import { denormalize } from 'normalizr';

import { IRecursiveDelete } from '../effects/recursive-entity-delete.effect';
import { IRequestDataState } from '../types/entity.types';
import {
  applicationSchemaKey,
  appStatsSchemaKey,
  cfUserSchemaKey,
  domainSchemaKey,
  EntitySchema,
  organizationSchemaKey,
  privateDomainsSchemaKey,
  quotaDefinitionSchemaKey,
  routeSchemaKey,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
  servicePlanSchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
  stackSchemaKey,
} from './entity-factory';

export interface IFlatTree {
  [entityKey: string]: Set<string>;
}

interface IExcludes {
  [entityKey: string]: string[];
}
export class EntitySchemaTreeBuilder {
  constructor(private excludes: IExcludes = {
    // Delete org
    [organizationSchemaKey]: [
      domainSchemaKey,
      quotaDefinitionSchemaKey,
      privateDomainsSchemaKey,
    ],
    // Delete space
    [spaceSchemaKey]: [
      domainSchemaKey,
      // Service instance related
      serviceSchemaKey,
      servicePlanSchemaKey,
      // App Related
      stackSchemaKey
    ],
    // Delete app
    [applicationSchemaKey]: [
      stackSchemaKey,
      spaceSchemaKey,
      routeSchemaKey,
      serviceBindingSchemaKey,
      serviceInstancesSchemaKey
    ],
    // Terminate app instance
    [appStatsSchemaKey]: [],
    // Delete route, unbind route
    [routeSchemaKey]: [
      domainSchemaKey,
      applicationSchemaKey
    ],
    // Unbind service instance
    [serviceBindingSchemaKey]: [
      applicationSchemaKey,
      serviceInstancesSchemaKey,
      serviceSchemaKey
    ],
    // Delete service instance
    [serviceInstancesSchemaKey]: [
      servicePlanSchemaKey,
      // Service bindings
      applicationSchemaKey,
      serviceInstancesSchemaKey,
      serviceSchemaKey
    ],
    // Remove a user role
    [cfUserSchemaKey]: [
      organizationSchemaKey,
      spaceSchemaKey
    ]
  }) { }

  private entityExcludes: string[];
  public getFlatTree(treeDefinition: IRecursiveDelete, state: Partial<IRequestDataState>): IFlatTree {
    const { schema, guid } = treeDefinition;
    const denormed = denormalize(guid, schema, state);
    this.entityExcludes = this.excludes[schema.key] || [];
    return this.build(schema, denormed, undefined, true);
  }

  private build(schema: EntitySchema, entity: any, flatTree: IFlatTree = {}, root = false): IFlatTree {
    if (Array.isArray(schema)) {
      schema = schema[0];
    }
    if (!schema || !entity || this.entityExcludes.includes(schema.key)) {
      return flatTree;
    }
    const keys = schema.definition ? Object.keys(schema.definition) : null;
    if (Array.isArray(entity)) {
      return entity.reduce((newFlatTree, newEntity) => {
        return this.applySchemaToTree(keys, schema, newEntity, newFlatTree);
      }, flatTree);
    }
    if (!(schema instanceof EntitySchema)) {
      return Object.keys(schema).reduce((newflatTree, key) => {
        return this.build(schema[key], entity[key], newflatTree);
      }, flatTree);
    }
    return this.applySchemaToTree(keys, schema, entity, flatTree, root);
  }

  private applySchemaToTree(keys: string[], schema: EntitySchema, entity: any, flatTree: IFlatTree = {}, root = false) {
    if (!entity) {
      return flatTree;
    }
    const { definition } = schema;
    if (!schema.getId) {
      return this.build(schema[schema.key], schema[schema.key], flatTree);
    }
    // Don't add the root element to the tree to avoid duplication actions whe consuming tree
    if (!root) {
      flatTree = this.addIdToTree(flatTree, schema.key, schema.getId(entity));
    }
    if (!keys) {
      return flatTree;
    }
    return keys.reduce((fullFlatTree, key) => {
      const newEntity = entity[key];
      const entityDefinition = this.getDefinition(definition[key]);
      if (Array.isArray(newEntity)) {
        return this.build(entityDefinition, newEntity, fullFlatTree);
      }

      return this.handleSingleChildEntity(entityDefinition, newEntity, fullFlatTree, key);
    }, flatTree);
  }

  private addIdToTree(flatTree: IFlatTree, key: string, newId: string) {
    const ids = flatTree[key] || new Set<string>();
    flatTree[key] = ids.add(newId);
    return flatTree;
  }

  private getDefinition(definition) {
    if (Array.isArray(definition)) {
      return definition[0];
    }
    return definition;
  }

  private handleSingleChildEntity(entityDefinition: EntitySchema, entity, flatTree: IFlatTree, key: string) {
    if (!entity) {
      return flatTree;
    }
    if (!(entityDefinition instanceof EntitySchema)) {
      return this.build(entityDefinition, entity, flatTree);
    }
    const id = entityDefinition.getId(entity);
    const entityKeys = flatTree[key];
    if (!id || (entityKeys && entityKeys.has(id))) {
      if (entityDefinition.definition) {
        return this.build(entityDefinition.definition as EntitySchema, entity, flatTree);
      }
      return flatTree;
    }
    flatTree = this.addIdToTree(flatTree, key, id);
    const subKeys = Object.keys(entityDefinition);
    if (subKeys.length > 0) {
      return this.build(entityDefinition, entity, flatTree);
    }
    return flatTree;
  }
}

