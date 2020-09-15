import { denormalize } from 'normalizr';

import { IRequestTypeState } from '../app-state';
import { IRecursiveDelete } from '../effects/recursive-entity-delete.effect';
import { EntitySchema } from './entity-schema';

export interface IFlatTreeValue {
  schema: EntitySchema;
  ids: Set<string>;
}
export interface IFlatTree {
  [entityKey: string]: IFlatTreeValue;
}

export class EntitySchemaTreeBuilder {

  private entityExcludes: string[];
  public getFlatTree(treeDefinition: IRecursiveDelete, state: IRequestTypeState): IFlatTree {
    const { schema, guid } = treeDefinition;
    const denormed = denormalize(guid, schema, state);
    this.entityExcludes = schema.excludeFromRecursiveDelete || [];
    return this.build(schema, denormed, undefined, true);
  }

  private build(schema: EntitySchema, entity: any, flatTree: IFlatTree = {}, root = false): IFlatTree {
    if (Array.isArray(schema)) {
      schema = schema[0];
    }
    if (!schema || !entity || this.entityExcludes.includes(schema.entityType)) {
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
      return this.build(schema[schema.entityType], schema[schema.entityType], flatTree);
    }
    // Don't add the root element to the tree to avoid duplication actions when consuming tree
    if (!root) {
      flatTree = this.addIdToTree(flatTree, schema.key, schema.getId(entity), schema);
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
      return this.handleSingleChildEntity(entityDefinition, newEntity, fullFlatTree, entityDefinition.key);
    }, flatTree);
  }

  private addIdToTree(flatTree: IFlatTree, key: string, newId: string, schema: EntitySchema) {
    if (!flatTree[key]) {
      flatTree[key] = {
        schema,
        ids: new Set<string>()
      };
    }
    flatTree[key].ids = flatTree[key].ids.add(newId);
    return flatTree;
  }

  private getDefinition(definition): EntitySchema {
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
    const entityKeys = flatTree[key] ? flatTree[key].ids : null;
    if (!id || (entityKeys && entityKeys.has(id))) {
      if (entityDefinition.definition) {
        return this.build(entityDefinition.definition as EntitySchema, entity, flatTree);
      }
      return flatTree;
    }
    flatTree = this.addIdToTree(flatTree, key, id, entityDefinition);
    const subKeys = Object.keys(entityDefinition);
    if (subKeys.length > 0) {
      return this.build(entityDefinition, entity, flatTree);
    }
    return flatTree;
  }
}

