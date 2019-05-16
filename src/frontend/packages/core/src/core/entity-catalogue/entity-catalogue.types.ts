import { Observable } from 'rxjs';
import { StratosStatus } from '../../shared/shared.types';
import { EntitySchema, entityFactory, endpointSchemaKey } from '../../../../store/src/helpers/entity-factory';
import { EndpointAuthTypeConfig } from '../extension/extension-types';
import { getFullEndpointApiUrl } from '../../features/endpoints/endpoint-helpers';
import { IEndpointFavMetadata } from '../../../../store/src/types/user-favorites.types';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { EntityCatalogueHelpers } from './entity-catalogue.helper';
export const STRATOS_ENDPOINT_TYPE = 'stratos';
export interface EntityCatalogueEntityConfig {
  entityType: string;
  endpointType: string;
  subType?: string;
  schemaKey?: string;
}
export interface EntityCatalogueSchemas {
  default: EntitySchema;
  [schemaKey: string]: EntitySchema;
}
export interface IStratosEntityWithIcons {
  icon?: string;
  // TODO (nj): can we allow entity import custom icon fonts?
  iconFont?: string;
}

export interface IEntityMetadata {
  name: string;
  [key: string]: string;
}
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/**
 * Static information describing a base stratos entity.
 *
 * @export
 */
export interface IStratosBaseEntityDefinition<T = EntitySchema | EntityCatalogueSchemas> extends IStratosEntityWithIcons {
  readonly type: string;
  readonly schema: T;
  readonly label?: string;
  readonly labelPlural?: string;
  readonly renderPriority?: number;
  // This should be typed
  readonly listDetailsComponent?: any;
  readonly parentType?: string;
  readonly subTypes?: Omit<IStratosBaseEntityDefinition, 'schema' | 'subTypes'>[];
}



/**
 * Static information describing a stratos endpoint.
 *
 * @export
 */
export interface IStratosEndpointDefinition extends IStratosBaseEntityDefinition<EntityCatalogueSchemas> {
  readonly logoUrl: string;
  readonly tokenSharing?: boolean;
  readonly urlValidation?: boolean;
  readonly unConnectable?: boolean;
  readonly urlValidationRegexString?: string;
  readonly authTypes: EndpointAuthTypeConfig[];
  readonly subTypes?: Omit<IStratosEndpointDefinition, 'schema' | 'subTypes'>[];
}

export interface IStratosEndpointWithoutSchemaDefinition extends Omit<IStratosEndpointDefinition, 'schema'> { }

/**
 * Static information describing a stratos entity.
 *
 * @export
 */
export interface IStratosEntityDefinition<T = EntitySchema | EntityCatalogueSchemas> extends IStratosBaseEntityDefinition<T> {
  readonly endpoint: IStratosEndpointDefinition;
}

export interface IStratosEntityActions extends Partial<IStratosEntityWithIcons> {
  readonly label: string;
  readonly action: () => void;
  readonly actionable?: Observable<boolean>;
  readonly disabled?: Observable<boolean>;
}

export interface IStratosEntityBuilder<T extends IEntityMetadata, Y = any> {
  getMetadata(entity: Y): T;
  getStatusObservable?(entity: Y): Observable<StratosStatus>;
  getGuid(entityMetadata: T): string;
  getLink?(entityMetadata: T): string;
  getLines?(entityMetadata: T): [string, string | Observable<string>][];
  getSubTypeLabels?(entityMetadata: T): {
    singular: string,
    plural: string
  };
  /**
   * Actions that don't effect an individual entity i.e. create new
   * @returns global actions
   */
  getGlobalActions?(): IStratosEntityActions[];
  /**
   * Actions that effect on individual entity i.e. rename
   * @returns global actions
   */
  getActions?(entityMetadata: T): IStratosEntityActions[];
}

export interface IStratosEntityData<T extends IEntityMetadata = IEntityMetadata> {
  metadata: T;
  link: string;
  guid: string;
  lines: [string, string | Observable<string>][];
  actions?: IStratosEntityActions[];
  globalActions?: IStratosEntityActions[];
}

export interface IStratosEntityStatusData<Y extends IEntityMetadata = IEntityMetadata> extends IStratosEntityData<Y> {
  status$?: Observable<StratosStatus>;
}

export class StratosBaseCatalogueEntity<T extends IEntityMetadata = IEntityMetadata, Y = any> {
  public readonly entityKey: string;
  public readonly entity: IStratosEntityDefinition<EntityCatalogueSchemas> | IStratosEndpointDefinition;
  public readonly isEndpoint: boolean;
  // TODO we should do some typing magic to hide this from extensions - nj
  public readonly isStratosType: boolean;
  public readonly hasBuilder: boolean;

  constructor(
    entity: IStratosEntityDefinition | IStratosEndpointDefinition,
    public builder?: IStratosEntityBuilder<T, Y>
  ) {
    this.entity = this.populateEntity(entity);
    const baseEntity = entity as IStratosEntityDefinition;
    this.isEndpoint = !this.isStratosType && !baseEntity.endpoint;
    this.hasBuilder = !!builder;
    this.entityKey = this.isEndpoint ?
      EntityCatalogueHelpers.buildEntityKey(EntityCatalogueHelpers.endpointType, baseEntity.type) :
      EntityCatalogueHelpers.buildEntityKey(baseEntity.type, this.isStratosType ? '' : baseEntity.endpoint.type);
  }

  private populateEntity(entity: IStratosEntityDefinition | IStratosEndpointDefinition) {
    const schema = entity.schema instanceof EntitySchema ? {
      default: entity.schema
    } : entity.schema;

    return {
      ...entity,
      type: entity.type || schema.default.entityType,
      label: entity.label || 'Unknown',
      labelPlural: entity.labelPlural || entity.label || 'Unknown',
      schema
    };
  }
  /**
   * Gets the schema associated with the entity type.
   * If no schemaKey is provided then the default schema will be returned
   */
  public getSchema(schemaKey?: string) {
    // TODO(NJ) We should do a better job at typeing schema
    // schema always gets changed to a EntityCatalogueSchamas.
    const catalogueSchema = (this.entity.schema as EntityCatalogueSchemas);
    if (!schemaKey || this.isEndpoint) {
      return catalogueSchema.default;
    }
    const entityCatalogue = this.entity as IStratosEntityDefinition;
    const tempId = EntityCatalogueHelpers.buildEntityKey(entityCatalogue.endpoint.type, schemaKey);
    if (!catalogueSchema[schemaKey] && tempId === this.entityKey) {
      // We've requested the default by passing the schema key that matches the entity type
      return catalogueSchema.default;
    }
    return catalogueSchema[schemaKey];
  }

  public getTypeAndSubtype() {
    const type = this.entity.parentType || this.entity.type;
    const subType = this.entity.parentType ? this.entity.type : null;
    return {
      type,
      subType
    };
  }
}

export class StratosCatalogueEntity<T extends IEntityMetadata = IEntityMetadata, Y = any> extends StratosBaseCatalogueEntity<T, Y> {
  public entity: IStratosEntityDefinition<EntityCatalogueSchemas>;
  constructor(
    entity: IStratosEntityDefinition,
    builder?: IStratosEntityBuilder<T, Y>
  ) {
    super(entity, builder);
  }
}

export class StratosCatalogueEndpointEntity extends StratosBaseCatalogueEntity<IEndpointFavMetadata, EndpointModel> {
  static readonly baseEndpointRender = {
    getMetadata: endpoint => ({
      name: endpoint.name,
      guid: endpoint.guid,
      address: getFullEndpointApiUrl(endpoint),
      user: endpoint.user ? endpoint.user.name : undefined,
      subType: endpoint.sub_type,
      admin: endpoint.user ? endpoint.user.admin ? 'Yes' : 'No' : undefined
    }),
    getLink: () => null,
    getGuid: metadata => metadata.guid,
    getLines: metadata => [
      ['Address', metadata.address],
      ['User', metadata.user],
      ['Admin', metadata.admin]
    ]
  } as IStratosEntityBuilder<IEndpointFavMetadata, EndpointModel>;
  // This is needed here for typing
  public entity: IStratosEndpointDefinition;
  constructor(
    entity: IStratosEndpointWithoutSchemaDefinition | IStratosEndpointDefinition,
    getLink?: (metadata: IEndpointFavMetadata) => string
  ) {
    const fullEntity = {
      ...entity,
      schema: {
        default: entityFactory(endpointSchemaKey)
      }
    } as IStratosEndpointDefinition;
    super(fullEntity, {
      ...StratosCatalogueEndpointEntity.baseEndpointRender,
      getLink: getLink || StratosCatalogueEndpointEntity.baseEndpointRender.getLink
    });
  }
}


