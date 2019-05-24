import { Observable } from 'rxjs';
import { StratosStatus } from '../../shared/shared.types';
import { EndpointAuthTypeConfig } from '../extension/extension-types';
import { EntitySchema } from '../../../../store/src/helpers/entity-schema';


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

