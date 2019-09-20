import { RecursiveDelete } from '../effects/recursive-entity-delete.effect';
import { EntitySchema } from './entity-schema';
import { EntitySchemaTreeBuilder, IFlatTreeValue } from './schema-tree-traverse';

describe('SchemaTreeTraversal', () => {
  let entitySchemaTreeBuilder: EntitySchemaTreeBuilder;
  const endpointType = 'endpointType';
  const parentKey = 'parentKey';
  const childKey = 'childKey1';
  const grandChildKey = 'grandChild1';
  const greatGrandChildKey = 'greatGrandChild1';

  beforeEach(() => {
    entitySchemaTreeBuilder = new EntitySchemaTreeBuilder();
  });

  it('should get tree with no arrays', () => {
    const parentId = '1';
    const childId = '2';
    const grandchildId = '3';

    const grandChildSchema = new EntitySchema(grandChildKey, endpointType);
    const childSchema = new EntitySchema(childKey, endpointType, {
      [grandChildSchema.entityType]: grandChildSchema
    });
    const parentSchema = new EntitySchema(parentKey, endpointType, {
      [childSchema.entityType]: childSchema
    });

    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childSchema.entityType]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          [grandChildSchema.entityType]: grandchildId
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId
        }
      }
    };
    const action = new RecursiveDelete(parentId, parentSchema);
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    const res1: IFlatTreeValue = {
      schema: childSchema,
      ids: new Set([
        childId
      ])
    };
    const res2: IFlatTreeValue = {
      schema: grandChildSchema,
      ids: new Set([
        grandchildId
      ])
    };

    expect(Object.keys(build)).toEqual([childSchema.key, grandChildSchema.key]);
    expect(build[childSchema.key]).toEqual(res1);
    expect(build[grandChildSchema.key]).toEqual(res2);
    expect(build).toEqual({
      [childSchema.key]: res1,
      [grandChildSchema.key]: res2
    });
  });

  it('should get tree with array 1', () => {
    const parentId = '1';
    const childId = '2';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const grandChildSchema = new EntitySchema(grandChildKey, endpointType);
    const childSchema = new EntitySchema(childKey, endpointType, {
      [grandChildSchema.entityType]: [grandChildSchema]
    });
    const parentSchema = new EntitySchema(parentKey, endpointType, {
      [childSchema.entityType]: childSchema
    });
    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childSchema.entityType]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          [grandChildSchema.entityType]: [grandchildId, grandchildId, grandchild2Id]
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId
        },
        [grandchild2Id]: {
          id: grandchild2Id
        }
      }
    };
    const action = new RecursiveDelete(parentId, parentSchema);
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    const res1: IFlatTreeValue = {
      schema: childSchema,
      ids: new Set([
        childId
      ])
    };
    const res2: IFlatTreeValue = {
      schema: grandChildSchema,
      ids: new Set([
        grandchildId,
        grandchild2Id
      ])
    };
    expect(build).toEqual({
      [childSchema.key]: res1,
      [grandChildSchema.key]: res2
    });
  });

  it('should get tree with array 2', () => {
    const parentId = '1';
    const childId = '2';
    const child2Id = '5';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const greatGrandChildSchema = new EntitySchema(greatGrandChildKey, endpointType);
    const grandChildSchema = new EntitySchema(grandChildKey, endpointType, {
      [greatGrandChildSchema.entityType]: [greatGrandChildSchema]
    });
    const childSchema = new EntitySchema(childKey, endpointType, {
      [grandChildSchema.entityType]: [grandChildSchema]
    });
    const parentSchema = new EntitySchema(parentKey, endpointType, {
      [childSchema.entityType]: childSchema
    });
    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childSchema.entityType]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          [grandChildSchema.entityType]: [grandchildId, grandchild2Id]
        },
        [child2Id]: {
          id: child2Id,
          [grandChildSchema.entityType]: [grandchildId, grandchild2Id]
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId,
          [greatGrandChildSchema.entityType]: [childId, 'unknown']
        },
        [grandchild2Id]: {
          id: grandchild2Id,
          [greatGrandChildSchema.entityType]: [childId, child2Id]
        }
      },
      [greatGrandChildSchema.key]: {
        [childId]: {
          id: childId
        },
        [child2Id]: {
          id: child2Id
        }
      }
    };
    const action = new RecursiveDelete(parentId, parentSchema);
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    const res1: IFlatTreeValue = {
      schema: childSchema,
      ids: new Set([
        childId
      ])
    };
    const res2: IFlatTreeValue = {
      schema: grandChildSchema,
      ids: new Set([
        grandchildId,
        grandchild2Id
      ])
    };
    const res3: IFlatTreeValue = {
      schema: greatGrandChildSchema,
      ids: new Set([
        childId,
        child2Id
      ])
    };

    expect(build).toEqual({
      [childSchema.key]: res1,
      [grandChildSchema.key]: res2,
      [greatGrandChildSchema.key]: res3
    });
  });

  it('should get tree with object', () => {
    const parentId = '1';
    const childId = '2';
    const child2Id = '5';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const greatGrandChildSchema = new EntitySchema(greatGrandChildKey, endpointType);
    const grandChildSchema = new EntitySchema(grandChildKey, endpointType, {
      [greatGrandChildSchema.entityType]: [greatGrandChildSchema]
    });
    const childSchema = new EntitySchema(childKey, endpointType, {
      entity: {
        [grandChildSchema.entityType]: [grandChildSchema]
      }
    });
    const parentSchema = new EntitySchema(parentKey, endpointType, {
      [childSchema.entityType]: childSchema
    });
    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childKey]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          entity: {
            [grandChildKey]: [grandchildId, grandchild2Id]
          }
        },
        [child2Id]: {
          id: child2Id,
          entity: {
            [grandChildKey]: [grandchildId, grandchild2Id]
          }
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId,
          [greatGrandChildSchema.entityType]: [childId, 'unknown']
        },
        [grandchild2Id]: {
          id: grandchild2Id,
          [greatGrandChildSchema.entityType]: [childId, child2Id]
        }
      },
      [greatGrandChildSchema.key]: {
        [childId]: {
          id: childId
        },
        [child2Id]: {
          id: child2Id
        }
      }
    };
    const action = new RecursiveDelete(parentId, parentSchema);
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    const res1: IFlatTreeValue = {
      schema: childSchema,
      ids: new Set([
        childId
      ])
    };
    const res2: IFlatTreeValue = {
      schema: grandChildSchema,
      ids: new Set([
        grandchildId,
        grandchild2Id
      ])
    };
    const res3: IFlatTreeValue = {
      schema: greatGrandChildSchema,
      ids: new Set([
        childId,
        child2Id
      ])
    };
    expect(build).toEqual({
      [childSchema.key]: res1,
      [grandChildSchema.key]: res2,
      [greatGrandChildSchema.key]: res3
    });
  });

  it('should exclude entity', () => {
    const parentId = '1';
    const childId = '2';
    const child2Id = '5';
    const grandchildId = '3';
    const grandchild2Id = '4';
    const greatGrandChildSchema = new EntitySchema(greatGrandChildKey, endpointType);
    const grandChildSchema = new EntitySchema(grandChildKey, endpointType, {
      [greatGrandChildSchema.entityType]: [greatGrandChildSchema]
    });
    const childSchema = new EntitySchema(childKey, endpointType, {
      entity: {
        [grandChildSchema.entityType]: [grandChildSchema]
      }
    });
    const parentSchema = new EntitySchema(parentKey, endpointType, {
      [childSchema.entityType]: childSchema
    }, {}, null, null, [grandChildSchema.entityType]);

    const state = {
      [parentSchema.key]: {
        [parentId]: {
          id: parentId,
          [childSchema.entityType]: childId
        }
      },
      [childSchema.key]: {
        [childId]: {
          id: childId,
          entity: {
            [grandChildKey]: [grandchildId, grandchild2Id]
          }
        },
        NOPE: {
          id: 'NOPE',
          entity: {
            [grandChildKey]: [grandchildId, grandchild2Id]
          }
        }
      },
      [grandChildSchema.key]: {
        [grandchildId]: {
          id: grandchildId,
          [greatGrandChildSchema.entityType]: ['NOPE']
        },
        [grandchild2Id]: {
          id: grandchild2Id,
          [greatGrandChildSchema.entityType]: [childId, child2Id]
        }
      },
      [greatGrandChildSchema.key]: {
        [childId]: {
          id: childId
        },
        [child2Id]: {
          id: child2Id
        }
      }
    };
    const action = new RecursiveDelete(parentId, parentSchema);
    const build = entitySchemaTreeBuilder.getFlatTree(action, state);
    const res1: IFlatTreeValue = {
      schema: childSchema,
      ids: new Set([
        childId
      ])
    };
    expect(Object.keys(build)).toEqual([childSchema.key]);
    expect(build).toEqual({
      [childSchema.key]: res1
    });
  });
});
