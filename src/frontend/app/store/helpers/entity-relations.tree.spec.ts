import { EntitySchema } from './entity-factory';
import { fetchEntityTree } from './entity-relations.tree';
import { createEntityRelationKey, EntityInlineParentAction } from './entity-relations.types';

describe('Entity Relations - Tree', () => {

  function createBaseAction(): EntityInlineParentAction {
    const entityKey = 'parent';
    return {
      entityKey,
      entity: new EntitySchema(entityKey),
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
    const childSchema = new EntitySchema('child1');

    const action = createBaseAction();
    action.entity = new EntitySchema(action.entityKey, {
      entity: {
        rel1: childSchema
      }
    });

    const res = fetchEntityTree(action);
    expect(res.maxDepth).toBe(0);
    expect(res.requiredParamNames.length).toBe(0);
  });

  it('relation depth of 1 with relations (key)', () => {
    const childSchema = new EntitySchema('child1', {}, {}, 'rel1');

    const action = createBaseAction();
    action.includeRelations = [createEntityRelationKey(action.entityKey, childSchema.relationKey)];
    action.entity = new EntitySchema(action.entityKey, {
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
    const childSchema = new EntitySchema('child1');

    const action = createBaseAction();
    action.includeRelations = [createEntityRelationKey(action.entityKey, childSchema.key)];
    action.entity = new EntitySchema(action.entityKey, {
      entity: {
        [childSchema.key]: childSchema
      }
    });

    const res = fetchEntityTree(action, false);
    expect(res.maxDepth).toBe(1);
    expect(res.requiredParamNames.length).toBe(1);
    expect(res.requiredParamNames).toEqual([childSchema.key]);
  });

  it('relation depth of 2 with relations', () => {
    const child2Schema = new EntitySchema('child2');
    const child1Schema = new EntitySchema('child1', {
      entity: {
        [child2Schema.key]: child2Schema
      }
    });

    const action = createBaseAction();
    action.includeRelations = [
      createEntityRelationKey(action.entityKey, child1Schema.key),
      createEntityRelationKey(child1Schema.key, child2Schema.key)
    ];
    action.entity = new EntitySchema(action.entityKey, { entity: { [child1Schema.key]: child1Schema } });

    const res = fetchEntityTree(action, false);
    expect(res.maxDepth).toBe(2);
    expect(res.requiredParamNames.length).toBe(2);
    expect(res.requiredParamNames).toEqual([child1Schema.key, child2Schema.key]);
  });

  it('relation depth of 2 without relations', () => {
    const child2Schema = new EntitySchema('child2');
    const child1Schema = new EntitySchema('child1', {
      entity: {
        [child2Schema.key]: child2Schema
      }
    });

    const action = createBaseAction();
    action.entity = new EntitySchema(action.entityKey, { entity: { [child1Schema.key]: child1Schema } });

    const res = fetchEntityTree(action, false);
    expect(res.maxDepth).toBe(0);
    expect(res.requiredParamNames.length).toBe(0);
  });

});
