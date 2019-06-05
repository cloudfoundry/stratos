import { listEntityRelations } from './entity-relations';
import { createEntityRelationKey, EntityInlineParentAction } from './entity-relations.types';
import { CFEntitySchema } from '../entity-factory';

describe('Entity Relations - List relations', () => {
  function createBaseAction(): EntityInlineParentAction {
    const entityKey = 'parent';
    return {
      endpointType: 'cf',
      entityType: entityKey,
      entity: new CFEntitySchema(entityKey),
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

    const res = listEntityRelations(action);
    expect(res.maxDepth).toBe(2);
    expect(res.relations.length).toBe(2);
    expect(res.relations).toEqual([child1Schema.entityType, child2Schema.entityType]);
  });

});


