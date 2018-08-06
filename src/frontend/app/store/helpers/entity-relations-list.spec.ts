import { EntitySchema } from './entity-factory';
import { listEntityRelations } from './entity-relations';
import { createEntityRelationKey, EntityInlineParentAction } from './entity-relations.types';

describe('Entity Relations - List relations', () => {
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

  // See entity-relations.tree.spec for main tests
  it('no relations', () => {
    const res = listEntityRelations(createBaseAction());
    expect(res.maxDepth).toBe(0);
    expect(res.relations.length).toBe(0);
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

    const res = listEntityRelations(action);
    expect(res.maxDepth).toBe(2);
    expect(res.relations.length).toBe(2);
    expect(res.relations).toEqual([child1Schema.key, child2Schema.key]);
  });

});


