import { HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import { endpointEntityType } from '../../../store/src/helpers/stratos-entity-factory';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { cfEntityFactory } from '../cf-entity-factory';
import {
  applicationEntityType,
  organizationEntityType,
  serviceBindingEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
  userProvidedServiceInstanceEntityType,
} from '../cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
  EntityInlineParentAction,
} from '../entity-relations/entity-relations.types';
import { QParam, QParamJoiners } from '../shared/q-param';
import { CFStartAction } from './cf-action.types';

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
      createEntityRelationPaginationKey(endpointEntityType, endpointGuid));
    this.options = new HttpRequest(
      'GET',
      `user_provided_service_instances`,
    );
    if (spaceGuid) {
      this.initialParams.q = [new QParam('space_guid', spaceGuid, QParamJoiners.in).toString()];
    }
  }
  actions = getActions('User Provided Services', 'Get all User Provided Services');
  entity = [cfEntityFactory(userProvidedServiceInstanceEntityType)];
  entityType = userProvidedServiceInstanceEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
    q: []
  };
  flattenPagination = true;
  flattenPaginationMax = true;
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
    this.options = new HttpRequest(
      'GET',
      `user_provided_service_instances/${guid}`
    );
  }
  actions = getActions('User Provided Service', 'Get User Provided Service');
  entity = cfEntityFactory(userProvidedServiceInstanceEntityType);
  entityType = userProvidedServiceInstanceEntityType;
  options: HttpRequest<any>;
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
    public proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  ) {
    super();
    const {
      spaceGuid,
      name,
      credentials = {},
      syslog_drain_url,
      route_service_url,
      tags = []
    } = data;
    this.options = new HttpRequest(
      'POST',
      `user_provided_service_instances`,
      {
        space_guid: spaceGuid,
        name,
        credentials,
        syslog_drain_url,
        route_service_url,
        tags
      }
    );

  }
  actions = getActions('User Provided Service', 'Create User Provided Service');
  entity = [cfEntityFactory(userProvidedServiceInstanceEntityType)];
  entityType = userProvidedServiceInstanceEntityType;
  options: HttpRequest<any>;
}

export class UpdateUserProvidedServiceInstance extends CFStartAction implements ICFAction {
  static updateServiceInstance = 'Updating-User-Provided';
  constructor(
    public endpointGuid: string,
    public guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
    public proxyPaginationEntityConfig?: EntityCatalogEntityConfig
  ) {
    super();
    const {
      name,
      credentials = {},
      syslog_drain_url,
      route_service_url,
      tags = []
    } = data;
    this.options = new HttpRequest(
      'PUT',
      `user_provided_service_instances/${guid}`,
      // TODO Make sure this still works after angular 8 update
      // We might need to go back to the if statements

      {
        name,
        syslog_drain_url,
        tags,
        credentials,
        route_service_url
      }
    );
  }
  actions = getActions('User Provided Service', 'Update User Provided Service');
  entity = [cfEntityFactory(userProvidedServiceInstanceEntityType)];
  entityType = userProvidedServiceInstanceEntityType;
  options: HttpRequest<any>;
  updatingKey = UpdateUserProvidedServiceInstance.updateServiceInstance;
}

export class DeleteUserProvidedInstance extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public guid: string, public proxyPaginationEntityConfig?: EntityCatalogEntityConfig) {
    super();
    this.options = new HttpRequest(
      'DELETE',
      `user_provided_service_instances/${guid}`
    );
  }
  actions = getActions('User Provided Service', 'Delete User Provided Service');
  entity = cfEntityFactory(userProvidedServiceInstanceEntityType);
  entityType = userProvidedServiceInstanceEntityType;
  options: HttpRequest<any>;
  clearPaginationEntityKeys = [serviceBindingEntityType];
  removeEntityOnDelete = true;
}
