import { EntitySchemaTreeBuilder } from './schema-tree-traverse';
import { entityFactory, organizationSchemaKey, EntitySchema } from './entity-factory';
import { RecursiveDelete } from '../effects/recusive-entity-delete.effect';


fdescribe('SchemaTreeTraversal', () => {
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
  it('should be created', () => {
    const parentId = '1';
    const childId = '2';
    const grandchildId = '3';
    const schema = new EntitySchema(parentKey, {
      entity: {
        [child1Key]: new EntitySchema(child1Key, {
          entity: {
            [grandChild1]: new EntitySchema(grandChild1)
          }
        })
      }
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
    const build = entitySchemaTreeBuilder.buildTree(action, state);
    // expect()
  });
});
