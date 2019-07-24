import { RequestOptions, URLSearchParams } from '@angular/http';

import { EntityCatalogueEntityConfig } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { getActions } from '../../../store/src/actions/action.helper';
import { endpointSchemaKey } from '../../../store/src/helpers/entity-factory';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import {
  applicationEntityType,
  cfEntityFactory,
  organizationEntityType,
  serviceBindingEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
  userProvidedServiceInstanceEntityType,
} from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import {
  createEntityRelationKey,
  EntityInlineParentAction,
  createEntityRelationPaginationKey
} from '../entity-relations/entity-relations.types';
import { QParamJoiners, QParam } from '../../../store/src/q-param';

export const getUserProvidedServiceInstanceRelations = [
  createEntityRelationKey(userProvidedServiceInstanceEntityType, spaceWithOrgEntityType),
  createEntityRelationKey(spaceEntityType, organizationEntityType),
  createEntityRelationKey(userProvidedServiceInstanceEntityType, serviceBindingEntityType),
  createEntityRelationKey(serviceBindingEntityType, applicationEntityType)
];

export class GetAllUserProvidedServices extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    paginationKey: string = null,
    public endpointGuid: string = null,
    public includeRelations: string[] = getUserProvidedServiceInstanceRelations,
    public populateMissing = true,
    public spaceGuid?: string
  ) {
    super();
    this.paginationKey = paginationKey || (spaceGuid ? createEntityRelationPaginationKey(spaceEntityType, spaceGuid) :
      createEntityRelationPaginationKey(endpointSchemaKey, endpointGuid));
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    if (spaceGuid) {
      this.initialParams.q = [new QParam('space_guid', spaceGuid, QParamJoiners.in).toString()];
    }
  }
  actions = getActions('User Provided Services', 'Get all User Provided Services');
  entity = [cfEntityFactory(userProvidedServiceInstanceEntityType)];
  entityType = userProvidedServiceInstanceEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
    q: []
  };
  flattenPagination = true;
  paginationKey: string;
}

export class GetUserProvidedService extends CFStartAction implements EntityInlineParentAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public includeRelations: string[] = [],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('User Provided Service', 'Get User Provided Service');
  entity = cfEntityFactory(userProvidedServiceInstanceEntityType);
  entityType = userProvidedServiceInstanceEntityType;
  options: RequestOptions;
}
export interface IUserProvidedServiceInstanceDataCredentials {
  [name: string]: string;
}
export interface IUserProvidedServiceInstanceData {
  spaceGuid: string;
  name: string;
  route_service_url?: string;
  syslog_drain_url?: string;
  tags?: string[];
  credentials?: IUserProvidedServiceInstanceDataCredentials;
}

export class CreateUserProvidedServiceInstance extends CFStartAction implements ICFAction {
  constructor(
    public endpointGuid: string,
    public guid: string,
    data: IUserProvidedServiceInstanceData,
    public proxyPaginationEntityConfig?: EntityCatalogueEntityConfig
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances`;
    this.options.params = new URLSearchParams();
    this.options.method = 'post';
    const {
      spaceGuid,
      name,
      credentials = {},
      syslog_drain_url,
      route_service_url,
      tags = []
    } = data;
    this.options.body = {
      space_guid: spaceGuid,
      name,
      credentials,
      syslog_drain_url,
      route_service_url,
      tags
    };
  }
  actions = getActions('User Provided Service', 'Create User Provided Service');
  entity = [cfEntityFactory(userProvidedServiceInstanceEntityType)];
  entityType = userProvidedServiceInstanceEntityType;
  options: RequestOptions;
}

export class UpdateUserProvidedServiceInstance extends CFStartAction implements ICFAction {
  static updateServiceInstance = 'Updating-User-Provided';
  constructor(
    public endpointGuid: string,
    public guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
    public proxyPaginationEntityConfig?: EntityCatalogueEntityConfig
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances/${guid}`;
    this.options.params = new URLSearchParams();
    // this.options.params.set('accepts_incomplete', 'true');
    this.options.method = 'put';
    this.options.body = {};
    const {
      name,
      credentials = {},
      syslog_drain_url,
      route_service_url,
      tags = []
    } = data;
    if (name) {
      this.options.body.name = name;
    }

    if (syslog_drain_url) {
      this.options.body.syslog_drain_url = syslog_drain_url;
    }
    if (tags) {
      this.options.body.tags = tags;
    }
    if (credentials) {
      this.options.body.credentials = credentials;
    }
    if (route_service_url) {
      this.options.body.route_service_url = route_service_url;
    }
  }
  actions = getActions('User Provided Service', 'Update User Provided Service');
  entity = [cfEntityFactory(userProvidedServiceInstanceEntityType)];
  entityType = userProvidedServiceInstanceEntityType;
  options: RequestOptions;
  updatingKey = UpdateUserProvidedServiceInstance.updateServiceInstance;
}

export class DeleteUserProvidedInstance extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public guid: string, public proxyPaginationEntityConfig?: EntityCatalogueEntityConfig) {
    super();
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('User Provided Service', 'Delete User Provided Service');
  entity = cfEntityFactory(userProvidedServiceInstanceEntityType);
  entityType = userProvidedServiceInstanceEntityType;
  options: RequestOptions;
  clearPaginationEntityKeys = [serviceBindingEntityType];
  removeEntityOnDelete = true;
}
