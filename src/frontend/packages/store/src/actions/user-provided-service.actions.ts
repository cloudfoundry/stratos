import { RequestOptions, URLSearchParams } from '@angular/http';

import {
  applicationSchemaKey,
  endpointSchemaKey,
  entityFactory,
  organizationSchemaKey,
  serviceBindingSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
  userProvidedServiceInstanceSchemaKey,
} from '../helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
} from '../helpers/entity-relations/entity-relations.types';
import { PaginatedAction, QParam } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';



export const getUserProvidedServiceInstanceRelations = [
  createEntityRelationKey(userProvidedServiceInstanceSchemaKey, spaceWithOrgKey),
  createEntityRelationKey(spaceSchemaKey, organizationSchemaKey),
  createEntityRelationKey(userProvidedServiceInstanceSchemaKey, serviceBindingSchemaKey),
  createEntityRelationKey(serviceBindingSchemaKey, applicationSchemaKey)
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
    this.paginationKey = paginationKey || (spaceGuid ? createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid) :
      createEntityRelationPaginationKey(endpointSchemaKey, endpointGuid));
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    if (spaceGuid) {
      this.initialParams.q = [new QParam('space_guid', spaceGuid, ' IN ')];
    }
  }
  actions = getActions('User Provided Services', 'Get all User Provided Services');
  entity = [entityFactory(userProvidedServiceInstanceSchemaKey)];
  entityKey = userProvidedServiceInstanceSchemaKey;
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
  entity = entityFactory(userProvidedServiceInstanceSchemaKey);
  entityKey = userProvidedServiceInstanceSchemaKey;
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
    public proxyPaginationEntityKey?: string
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
  entity = [entityFactory(userProvidedServiceInstanceSchemaKey)];
  entityKey = userProvidedServiceInstanceSchemaKey;
  options: RequestOptions;
}

export class UpdateUserProvidedServiceInstance extends CFStartAction implements ICFAction {
  static updateServiceInstance = 'Updating-User-Provided';
  constructor(
    public endpointGuid: string,
    public guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
    public proxyPaginationEntityKey?: string
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
  entity = [entityFactory(userProvidedServiceInstanceSchemaKey)];
  entityKey = userProvidedServiceInstanceSchemaKey;
  options: RequestOptions;
  updatingKey = UpdateUserProvidedServiceInstance.updateServiceInstance;
}

export class DeleteUserProvidedInstance extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public guid: string, public proxyPaginationEntityKey?: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('User Provided Service', 'Delete User Provided Service');
  entity = entityFactory(userProvidedServiceInstanceSchemaKey);
  entityKey = userProvidedServiceInstanceSchemaKey;
  options: RequestOptions;
  clearPaginationEntityKeys = [serviceBindingSchemaKey];
  removeEntityOnDelete = true;
}
