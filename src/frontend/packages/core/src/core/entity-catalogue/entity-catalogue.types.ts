import { Observable } from 'rxjs';
import { StratosStatus } from '../../shared/shared.types';
import { EntitySchema, entityFactory, endpointSchemaKey } from '../../../../store/src/helpers/entity-factory';
import { EndpointAuthTypeConfig } from '../extension/extension-types';
import { getFullEndpointApiUrl } from '../../features/endpoints/endpoint-helpers';
import { IEndpointFavMetadata } from '../../../../store/src/types/user-favorites.types';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';

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
export interface IStratosBaseEntityDefinition extends IStratosEntityWithIcons {
  readonly type: string;
  readonly schema: EntitySchema;
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
export interface IStratosEndpointDefinition extends IStratosBaseEntityDefinition {
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
export interface IStratosEntityDefinition extends IStratosBaseEntityDefinition {
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
  static endpointType = endpointSchemaKey;
  public id: string;
  public entity: IStratosEntityDefinition | IStratosEndpointDefinition;
  public isEndpoint: boolean;
  public hasBuilder: boolean;

  static buildId(entityType: string, endpointType: string): string {
    // Camelcased to make it work better with the store.
    return endpointType ? `${endpointType}${entityType.charAt(0).toUpperCase() + entityType.slice(1)}` : entityType;
  }
  constructor(
    entity: IStratosEntityDefinition | IStratosEndpointDefinition,
    // TODO: remove the need for a builder for entities that it doesn't make sense? NJ
    public builder?: IStratosEntityBuilder<T, Y>
  ) {
    this.entity = this.populateEntity(entity);
    const baseEntity = entity as IStratosEntityDefinition;
    this.isEndpoint = !baseEntity.endpoint;
    this.hasBuilder = !!builder;
    this.id = this.isEndpoint ?
      // 'endpoint' should be in the baseEntity somewhere - nj
      StratosBaseCatalogueEntity.buildId(StratosBaseCatalogueEntity.endpointType, baseEntity.type) :
      StratosBaseCatalogueEntity.buildId(baseEntity.type, baseEntity.endpoint.type);
  }
  private populateEntity(entity: IStratosEntityDefinition | IStratosEndpointDefinition) {
    return {
      ...entity,
      label: entity.label || 'Unknown',
      labelPlural: entity.labelPlural || entity.label || 'Unknown',
    };
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
  constructor(
    public entity: IStratosEntityDefinition,
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
    super({
      ...entity,
      schema: entityFactory(endpointSchemaKey)
    }, {
        ...StratosCatalogueEndpointEntity.baseEndpointRender,
        getLink: getLink || StratosCatalogueEndpointEntity.baseEndpointRender.getLink
      });
  }
}

