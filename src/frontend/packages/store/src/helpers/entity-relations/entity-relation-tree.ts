import { EntitySchema } from '../entity-schema';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';

/**
 * A structure which represents the tree like layout of entity dependencies. For example organization --> space --> routes
 *
 * @export
 */
export class EntityTreeRelation {
  public entityKey: string;
  public entityType: string;

  /**
   * Creates an instance of EntityTreeRelation.
   * @param [isArray=false] is this a collection of entities (should be paginationed) or not
   * @param paramName parameter name of the entity within the schema. For example `space` may be `spaces` (entity.spaces)
   * @param [path=''] location of the entity within the parent. For example `space` entity maybe be `entity.spaces`
   */
  constructor(
    public entity: EntitySchema,
    public isArray = false,
    public paramName: string, // space/spaces
    public path = '', // entity.space
    public childRelations: EntityTreeRelation[]
  ) {
    this.entityKey = entityCatalogue.getEntityKey(entity);
    this.entityType = entity.entityType;
  }
}
