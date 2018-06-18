import { RecursiveDelete } from '../effects/recusive-entity-delete.effect';
import { IRequestDataState } from '../types/entity.types';
import { schema, denormalize } from 'normalizr';

export interface ISchemaTree {
  [entityKey: string]: string[];
}

export class EntitySchemaTreeBuilder {
  public buildTree(treeDefinition: RecursiveDelete, state: Partial<IRequestDataState>): ISchemaTree {
    const { schema, guid } = treeDefinition;
    const parentEntity = state[schema.key][guid];
    const denormed = denormalize(parentEntity, schema, state);
    console.log(denormed);
    const schemaType = typeof treeDefinition.schema.schema;
    // const schema = treeDefinition.schema.schema as schema.Object;
    // schema.
    console.log(treeDefinition.schema.schema, schemaType);
    return {};
  }
}

