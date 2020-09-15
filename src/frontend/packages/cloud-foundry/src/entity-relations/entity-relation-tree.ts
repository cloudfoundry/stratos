import { entityCatalog } from '../../../store/src/entity-catalog/entity-catalog';
import { EntitySchema } from '../../../store/src/helpers/entity-schema';

/**
 * A structure which represents the tree like layout of entity dependencies. For example organization --> space --> routes
 *
 * @export
 */
export class EntityTreeRelation {
  /**
   * Where does this entity go into the store? (does contain endpointType)
   */
  public entityKey: string;
  /**
   * What is the core entity type (does not contain endpointType)
   */
  public entityType: string;

  /**
   * Creates an instance of EntityTreeRelation.
   * @param [isArray=false] is this a collection of entities (should be paginated) or not
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
    this.entityKey = entityCatalog.getEntityKey(entity);
    this.entityType = entity.entityType;
  }
}
