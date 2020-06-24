import { CFEntitySchema } from '../cf-entity-schema-types';
import { CF_ENDPOINT_TYPE } from '../cf-types';
import { fetchEntityTree } from './entity-relations.tree';
import { createEntityRelationKey, EntityInlineParentAction } from './entity-relations.types';

describe('Entity Relations - Tree', () => {

  function createBaseAction(): EntityInlineParentAction {
    const entityKey = 'parent';
    return {
      endpointType: CF_ENDPOINT_TYPE,
      entityType: entityKey,
      entity: new CFEntitySchema(entityKey),
      includeRelations: [],
      populateMissing: false,
      type: 'type',
    };
  }

  it('no relations', () => {
    const res = fetchEntityTree(createBaseAction());
    expect(res.maxDepth).toBe(0);
    expect(res.requiredParamNames.length).toBe(0);
  });

  it('relation depth of 1, no relations', () => {
    const childSchema = new CFEntitySchema('child1');

    const action = createBaseAction();
    action.entity = new CFEntitySchema(action.entityType, {
      entity: {
        rel1: childSchema
      }
    });

    const res = fetchEntityTree(action);
    expect(res.maxDepth).toBe(0);
    expect(res.requiredParamNames.length).toBe(0);
  });

  it('relation depth of 1 with relations (key)', () => {
    const childSchema = new CFEntitySchema('child1', {}, {}, 'rel1');

    const action = createBaseAction();
    action.includeRelations = [createEntityRelationKey(action.entityType, childSchema.relationKey)];
    action.entity = new CFEntitySchema(action.entityType, {
      entity: {
        [childSchema.relationKey]: childSchema
      }
    });

    const res = fetchEntityTree(action, false);
    expect(res.maxDepth).toBe(1);
    expect(res.requiredParamNames.length).toBe(1);
    expect(res.requiredParamNames).toEqual([childSchema.relationKey]);
  });

  it('relation depth of 1 with relations (type)', () => {
    const childSchema = new CFEntitySchema('child1');

    const action = createBaseAction();
    action.includeRelations = [createEntityRelationKey(action.entityType, childSchema.entityType)];
    action.entity = new CFEntitySchema(action.entityType, {
      entity: {
        [childSchema.entityType]: childSchema
      }
    });

    const res = fetchEntityTree(action, false);
    expect(res.maxDepth).toBe(1);
    expect(res.requiredParamNames.length).toBe(1);
    expect(res.requiredParamNames).toEqual([childSchema.entityType]);
  });

  it('relation depth of 2 with relations', () => {
    const child2Schema = new CFEntitySchema('child2');
    const child1Schema = new CFEntitySchema('child1', {
      entity: {
        [child2Schema.entityType]: child2Schema
      }
    });

    const action = createBaseAction();
    action.includeRelations = [
      createEntityRelationKey(action.entityType, child1Schema.entityType),
      createEntityRelationKey(child1Schema.entityType, child2Schema.entityType)
    ];
    action.entity = new CFEntitySchema(action.entityType, { entity: { [child1Schema.entityType]: child1Schema } });

    const res = fetchEntityTree(action, false);
    expect(res.maxDepth).toBe(2);
    expect(res.requiredParamNames.length).toBe(2);
    expect(res.requiredParamNames).toEqual([child1Schema.entityType, child2Schema.entityType]);
  });

  it('relation depth of 2 without relations', () => {
    const child2Schema = new CFEntitySchema('child2');
    const child1Schema = new CFEntitySchema('child1', {
      entity: {
        [child2Schema.entityType]: child2Schema
      }
    });

    const action = createBaseAction();
    action.entity = new CFEntitySchema(action.entityType, { entity: { [child1Schema.entityType]: child1Schema } });

    const res = fetchEntityTree(action, false);
    expect(res.maxDepth).toBe(0);
    expect(res.requiredParamNames.length).toBe(0);
  });

});

