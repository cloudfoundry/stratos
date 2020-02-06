import { EntitySchema } from '../../../store/src/helpers/entity-schema';
import { EntityTreeRelation } from './entity-relation-tree';
import { createEntityRelationKey, EntityInlineParentAction, EntityTree } from './entity-relations.types';

const entityTreeCache: {
  [entityKey: string]: EntityTree
} = {};

function generateCacheKey(entityKey: string, action: EntityInlineParentAction): string {
  const relationKey = Array.isArray(action.includeRelations) ?
    [...action.includeRelations].sort((a, b) => a.localeCompare(b)).join(',') :
    '';
  return entityKey + '+' + relationKey;
}

export function fetchEntityTree(action: EntityInlineParentAction, fromCache = true): EntityTree {
  const entityOrArray = action.entity;
  const isArray = Array.isArray(entityOrArray);
  const entity: EntitySchema = isArray ? entityOrArray[0] : entityOrArray;
  const entityKey = entity.entityType;
  const cacheKey = generateCacheKey(entityKey, action);
  const cachedTree = entityTreeCache[cacheKey];
  const entityTree = fromCache && cachedTree ? cachedTree : createEntityTree(entity as EntitySchema, isArray);
  entityTreeCache[cacheKey] = entityTree;
  // Calc max depth and exclude not needed
  entityTree.rootRelation.childRelations = parseEntityTree(entityTree, entityTree.rootRelation, action.includeRelations);
  return entityTree;
}

function createEntityTree(entity: EntitySchema, isArray: boolean) {

  const rootEntityRelation = new EntityTreeRelation(
    entity,
    isArray,
    null,
    '',
    new Array<EntityTreeRelation>()
  );
  const entityTree = {
    maxDepth: 0,
    rootRelation: rootEntityRelation,
    requiredParamNames: new Array<string>(),
  };
  buildEntityTree(entityTree, rootEntityRelation);
  return entityTree;
}

function buildEntityTree(tree: EntityTree, entityRelation: EntityTreeRelation, schemaObj?: EntitySchema, path: string = '') {
  const rootEntitySchema = schemaObj || entityRelation.entity.schema;
  Object.keys(rootEntitySchema).forEach(key => {
    const schemaOrArray = rootEntitySchema[key];
    const isArray = Array.isArray(schemaOrArray);
    const entitySchema = isArray ? schemaOrArray[0] : schemaOrArray;
    const newPath = path ? path + '.' + key : key;
    if (entitySchema instanceof EntitySchema) {
      const newEntityRelation = new EntityTreeRelation(
        entitySchema,
        isArray,
        key,
        newPath,
        new Array<EntityTreeRelation>()
      );
      entityRelation.childRelations.push(newEntityRelation);
      buildEntityTree(tree, newEntityRelation, null, '');
    } else if (entitySchema instanceof Object) {
      buildEntityTree(tree, entityRelation, entitySchema, newPath);
    }
  });
}

export function parseEntityTree(tree: EntityTree, entityRelation: EntityTreeRelation, includeRelations: string[] = [], )
  : EntityTreeRelation[] {
  const newChildRelations = new Array<EntityTreeRelation>();
  entityRelation.childRelations.forEach((relation: EntityTreeRelation) => {
    const parentChildKey = createEntityRelationKey(entityRelation.entityType, relation.entity.relationKey || relation.entityType);
    if (includeRelations.indexOf(parentChildKey) >= 0) {
      // Ensure we maintain type by creating new instance, rather than spreading old
      const clone = new EntityTreeRelation(relation.entity, relation.isArray, relation.paramName, relation.path, relation.childRelations);
      newChildRelations.push(clone);
      if (tree.requiredParamNames.indexOf(relation.paramName) < 0) {
        tree.requiredParamNames.push(relation.paramName);
      }
      clone.childRelations = parseEntityTree(tree, relation, includeRelations);
    }
  });
  entityRelation.childRelations = newChildRelations;
  if (entityRelation.childRelations.length) {
    tree.maxDepth = tree.maxDepth || 0;
    tree.maxDepth++;
  }
  return newChildRelations;
}

