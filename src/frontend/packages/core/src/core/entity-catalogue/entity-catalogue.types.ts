import { Observable } from 'rxjs';
import { StratosStatus } from '../../shared/shared.types';
import { EntitySchema, entityFactory, endpointSchemaKey } from '../../../../store/src/helpers/entity-factory';
import { EndpointAuthTypeConfig } from '../extension/extension-types';
import { getFullEndpointApiUrl } from '../../features/endpoints/endpoint-helpers';
import { EndpointModel, EndpointModel } from '../../../../store/src/types/endpoint.types';
import { IEndpointFavMetadata } from '../../../../store/src/types/user-favorites.types';

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
  readonly label: string;
  readonly labelPlural: string;
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

export interface IStratosEntityBuilder<T, Y extends IEntityMetadata> {
  getMetadata(entity: T): Y;
  getStatusObservable?(entityMetadata: T): Observable<StratosStatus>;
  getLink(entityMetadata: Y): string;
  getGuid(entityMetadata: Y): string;
  getLines?(entityMetadata: Y): [string, string | Observable<string>][];
  getSubTypeLabels?(entityMetadata: Y): {
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
  getActions?(entityMetadata: Y): IStratosEntityActions[];
}

export interface IStratosEntityData<Y extends IEntityMetadata = IEntityMetadata> {
  metadata: Y;
  link: string;
  guid: string;
  lines: [string, string | Observable<string>][];
  actions?: IStratosEntityActions[];
  globalActions?: IStratosEntityActions[];
}

export interface IStratosEntityStatusData<Y extends IEntityMetadata = IEntityMetadata> extends IStratosEntityData<Y> {
  status$?: Observable<StratosStatus>;
}

export class StratosBaseCatalogueEntity<T = any, Y extends IEntityMetadata = IEntityMetadata> {
  static endpointType = 'endpoint';
  public id: string;
  public isEndpoint: boolean;

  static buildId(entityType: string, endpointType: string): string {
    return endpointType ? `${endpointType}-${entityType}` : entityType;
  }
  constructor(
    public entity: IStratosEntityDefinition | IStratosEndpointDefinition,
    public builder: IStratosEntityBuilder<T, Y>
  ) {
    const baseEntity = entity as IStratosEntityDefinition;
    this.isEndpoint = !baseEntity.endpoint;
    this.id = this.isEndpoint ?
      // 'endpoint' should be in the baseEntity somewhere - nj
      StratosBaseCatalogueEntity.buildId(StratosBaseCatalogueEntity.endpointType, baseEntity.type) :
      StratosBaseCatalogueEntity.buildId(baseEntity.type, baseEntity.endpoint.type);
  }
  public getGeneratedData(entity: T, previousMetadata?: Y): IStratosEntityStatusData<Y> {
    const metadata = previousMetadata ? previousMetadata : this.builder.getMetadata(entity);
    return {
      metadata,
      status$: this.builder.getStatusObservable(entity),
      link: this.builder.getLink(metadata),
      guid: this.builder.getGuid(metadata),
      lines: this.builder.getLines(metadata),
      actions: this.builder.getActions ? this.builder.getActions(metadata) : null,
      globalActions: this.builder.getGlobalActions ? this.builder.getGlobalActions() : null
    };
  }
  public getTypeAndSubtype() {
    const type = this.entity.parentType || this.entity.type;
    const subType = this.entity.parentType ? this.entity.type : null;
    return {
      type,
      subType
    }
  }
}

export class StratosCatalogueEntity<T = any, Y extends IEntityMetadata = IEntityMetadata> extends StratosBaseCatalogueEntity<T, Y> {
  constructor(
    public entity: IStratosEntityDefinition,
    builder: IStratosEntityBuilder<T, Y>
  ) {
    super(entity, builder);
  }
}

export class StratosCatalogueEndpointEntity extends StratosBaseCatalogueEntity<EndpointModel, IEndpointFavMetadata> {
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
  } as IStratosEntityBuilder<EndpointModel, IEndpointFavMetadata>;
  // This is needed here for typing
  public entity: IStratosEndpointDefinition;
  constructor(
    entity: IStratosEndpointWithoutSchemaDefinition,
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

