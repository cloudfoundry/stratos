import { EntitySchemaTreeBuilder } from './schema-tree-traverse';
import { entityFactory, organizationSchemaKey, EntitySchema } from './entity-factory';
import { RecursiveDelete } from '../effects/recusive-entity-delete.effect';


describe('SchemaTreeTraversal', () => {
  let entitySchemaTreeBuilder: EntitySchemaTreeBuilder;
  const parentKey = 'parentKey';
  const child1Key = 'childKey1';
  const grandChild1 = 'grandChild1';
  const entityKey1 = 'entityKey1';
  const entityKey2 = 'entityKey1';
  const entityKey3 = 'entityKey1';
  beforeEach(() => {
    entitySchemaTreeBuilder = new EntitySchemaTreeBuilder();
  });
  it('should get tree with no arrays', () => {
    const parentId = '1';
    const childId = '2';
    const grandchildId = '3';
    const schema = new EntitySchema(parentKey, {
      [child1Key]: new EntitySchema(child1Key, {
        [grandChild1]: new EntitySchema(grandChild1)
      })
    });
    const state = {
      [parentKey]: {
        [parentId]: {
          id: parentId,
          [child1Key]: childId
        }
      },
      [child1Key]: {
        [childId]: {
          id: childId,
          [grandChild1]: grandchildId
        }
      },
      grandChild1: {
        [grandchildId]: {
          id: grandchildId
        }
      }
    };
    const action = new RecursiveDelete(parentId, schema);
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    expect(build).toEqual({
      [parentKey]: new Set([
        parentId
      ]),
      [child1Key]: new Set([
        childId
      ]),
      [grandChild1]: new Set([
        grandchildId
      ])
    });
  });
  it('should get tree with array', () => {
    const parentId = '1';
    const childId = '2';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const schema = new EntitySchema(parentKey, {
      [child1Key]: new EntitySchema(child1Key, {
        [grandChild1]: [new EntitySchema(grandChild1)]
      })
    });
    const state = {
      [parentKey]: {
        [parentId]: {
          id: parentId,
          [child1Key]: childId
        }
      },
      [child1Key]: {
        [childId]: {
          id: childId,
          [grandChild1]: [grandchildId, grandchildId, grandchild2Id]
        }
      },
      [grandChild1]: {
        [grandchildId]: {
          id: grandchildId
        },
        [grandchild2Id]: {
          id: grandchild2Id
        }
      }
    };
    const action = new RecursiveDelete(parentId, schema);
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    expect(build).toEqual({
      [parentKey]: new Set([
        parentId
      ]),
      [child1Key]: new Set([
        childId
      ]),
      [grandChild1]: new Set([
        grandchildId,
        grandchild2Id
      ])
    });
  });

  it('should get tree with array', () => {
    const parentId = '1';
    const childId = '2';
    const child2Id = '5';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const schema = new EntitySchema(parentKey, {
      [child1Key]: new EntitySchema(child1Key, {
        [grandChild1]: [new EntitySchema(grandChild1, {
          [child1Key]: [new EntitySchema(child1Key)]
        })]
      })
    });
    const state = {
      [parentKey]: {
        [parentId]: {
          id: parentId,
          [child1Key]: childId
        }
      },
      [child1Key]: {
        [childId]: {
          id: childId,
          [grandChild1]: [grandchildId, grandchild2Id]
        },
        [child2Id]: {
          id: child2Id,
          [grandChild1]: [grandchildId, grandchild2Id]
        }
      },
      [grandChild1]: {
        [grandchildId]: {
          id: grandchildId,
          [child1Key]: [childId, 'unknown']
        },
        [grandchild2Id]: {
          id: grandchild2Id,
          [child1Key]: [childId, child2Id]
        }
      }
    };
    const action = new RecursiveDelete(parentId, schema);
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    expect(build).toEqual({
      [parentKey]: new Set([
        parentId
      ]),
      [child1Key]: new Set([
        childId,
        child2Id
      ]),
      [grandChild1]: new Set([
        grandchildId,
        grandchild2Id
      ])
    });
  });

  fit('should get tree with object', () => {
    const parentId = '1';
    const childId = '2';
    const child2Id = '5';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const schema = new EntitySchema(parentKey, {
      [child1Key]: new EntitySchema(child1Key, {
        entity: {
          [grandChild1]: [new EntitySchema(grandChild1, {
            [child1Key]: [new EntitySchema(child1Key)]
          })]
        }
      })
    });
    const state = {
      [parentKey]: {
        [parentId]: {
          id: parentId,
          [child1Key]: childId
        }
      },
      [child1Key]: {
        [childId]: {
          id: childId,
          entity: {
            [grandChild1]: [grandchildId, grandchild2Id]
          }
        },
        [child2Id]: {
          id: child2Id,
          entity: {
            [grandChild1]: [grandchildId, grandchild2Id]
          }
        }
      },
      [grandChild1]: {
        [grandchildId]: {
          id: grandchildId,
          [child1Key]: [childId, 'unknown']
        },
        [grandchild2Id]: {
          id: grandchild2Id,
          [child1Key]: [childId, child2Id]
        }
      }
    };
    const action = new RecursiveDelete(parentId, schema);
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    expect(build).toEqual({
      [parentKey]: new Set([
        parentId
      ]),
      [child1Key]: new Set([
        childId,
        child2Id
      ]),
      [grandChild1]: new Set([
        grandchildId,
        grandchild2Id
      ])
    });
  });
});
