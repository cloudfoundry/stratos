import { RequestOptions, URLSearchParams } from '@angular/http';

import { endpointSchemaKey, entityFactory, spaceSchemaKey, userProvidedServiceInstanceSchemaKey } from '../helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
} from '../helpers/entity-relations/entity-relations.types';
import { PaginatedAction, QParam } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';
import { getServiceInstanceRelations } from './service-instances.actions';

export class GetAllUserProvidedServices extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public endpointGuid: string = null,
    public includeRelations: string[] = getServiceInstanceRelations,
    public populateMissing = true,
    public spaceGuid?: string
  ) {
    super();
    this.paginationKey = spaceGuid ? createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid) :
      createEntityRelationPaginationKey(endpointSchemaKey, endpointGuid);
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    if (spaceGuid) {
      this.initialParams.q = [new QParam('space_guid', spaceGuid, ' IN ')];
    }
  }
  actions = getActions('User Provided Services', 'Get all User Provided Services');
  entity = entityFactory(userProvidedServiceInstanceSchemaKey);
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
    public includeRelations: string[] = [
      // createEntityRelationKey(serviceSchemaKey, servicePlanSchemaKey)
    ],
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
export interface TUserProvidedServiceInstanceDataCredentials {
  [name: string]: string;
}
export interface IUserProvidedServiceInstanceData {
  spaceGuid: string;
  name: string;
  routeServiceUrl: string;
  syslogDrainUrl?: string;
  tags: string[];
  credentials: TUserProvidedServiceInstanceDataCredentials;
}

export class CreateUserProvidedServiceInstance extends CFStartAction implements ICFAction {
  constructor(
    public endpointGuid: string,
    public guid: string,
    data: IUserProvidedServiceInstanceData
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances`;
    this.options.params = new URLSearchParams();
    // this.options.params.set('accepts_incomplete', 'true');
    this.options.method = 'post';
    const {
      spaceGuid: space_guid,
      name,
      credentials = {},
      routeServiceUrl: route_service_url,
      syslogDrainUrl: syslog_drain_url,
      tags = []
    } = data;
    // TODO: RC Test empty values
    this.options.body = {
      space_guid,
      name,
      credentials,
      route_service_url,
      syslog_drain_url,
      tags
    };
  }
  actions = getActions('User Provided Service', 'Create User Provided Service');
  entity = [entityFactory(userProvidedServiceInstanceSchemaKey)];
  entityKey = userProvidedServiceInstanceSchemaKey;
  options: RequestOptions;
}

export class UpdateUserProvidedServiceInstance extends CFStartAction implements ICFAction {
  constructor(
    public endpointGuid: string,
    public guid: string,
    data: Partial<IUserProvidedServiceInstanceData>
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
      routeServiceUrl: route_service_url,
      syslogDrainUrl: syslog_drain_url,
      tags = []
    } = data;
    if (name) {
      this.options.body.name = name;
    }
    if (route_service_url) {
      this.options.body.route_service_url = route_service_url;
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
  }
  actions = getActions('User Provided Service', 'Create User Provided Service');
  entity = [entityFactory(userProvidedServiceInstanceSchemaKey)];
  entityKey = userProvidedServiceInstanceSchemaKey;
  options: RequestOptions;
}

export class DeleteUserProvidedInstance extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public guid: string, public proxyPaginationEntityKey?: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `user_provided_service_instances/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.set('accepts_incomplete', 'true');
    this.options.params.set('async', 'false');
    this.options.params.set('recursive', 'true');
  }
  actions = getActions('Service Instances', 'Delete Service Instance');
  entity = entityFactory(userProvidedServiceInstanceSchemaKey);
  entityKey = userProvidedServiceInstanceSchemaKey;
  options: RequestOptions;
  removeEntityOnDelete = true;
}
