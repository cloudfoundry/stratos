import { RequestMethod, RequestOptions, URLSearchParams } from '@angular/http';

import { IUpdateOrganization } from '../../../core/src/core/cf-api.types';
import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { CFEntityConfig } from '../../cf-types';
import {
  cfEntityFactory,
  cfUserEntityType,
  domainEntityType,
  organizationEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
} from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { createDefaultUserRelations } from './user.actions.helpers';
import {
  EntityInlineParentAction,
  EntityInlineChildAction,
  createEntityRelationPaginationKey
} from '../entity-relations/entity-relations.types';

export const GET_ORGANIZATION = '[Organization] Get one';
export const GET_ORGANIZATION_SUCCESS = '[Organization] Get one success';
export const GET_ORGANIZATION_FAILED = '[Organization] Get one failed';

export const GET_ORGANIZATIONS = '[Organization] Get all';
export const GET_ORGANIZATIONS_SUCCESS = '[Organization] Get all success';
export const GET_ORGANIZATIONS_FAILED = '[Organization] Get all failed';

export const GET_ORGANIZATION_SPACES = '[Space] Get all org spaces';
export const GET_ORGANIZATION_SPACES_SUCCESS = '[Space] Get all org spaces success';
export const GET_ORGANIZATION_SPACES_FAILED = '[Space] Get all org spaces failed';

export const GET_ORGANIZATION_DOMAINS = '[Organization] Get all org domains';
export const GET_ORGANIZATION_DOMAINS_SUCCESS = '[Organization] Get all org domains success';
export const GET_ORGANIZATION_DOMAINS_FAILED = '[Organization] Get all org domains failed';

export const DELETE_ORGANIZATION = '[Organization] Delete organization';
export const DELETE_ORGANIZATION_SUCCESS = '[Organization] Delete organization success';
export const DELETE_ORGANIZATION_FAILED = '[Organization] Delete organization failed';

export const GET_ORGANIZATION_USERS = '[Organization] Get all org users';
export const GET_ORGANIZATION_USERS_SUCCESS = '[Organization] Get all org users success';
export const GET_ORGANIZATION_USERS_FAILED = '[Organization] Get all org users failed';

export class GetOrganization extends CFStartAction implements ICFAction, EntityInlineParentAction {
  constructor(
    public guid: string,
    public endpointGuid: string,
    public includeRelations: string[] = [],
    public populateMissing = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = [
    GET_ORGANIZATION,
    GET_ORGANIZATION_SUCCESS,
    GET_ORGANIZATION_FAILED
  ];
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: RequestOptions;
}

export class GetAllOrganizationSpaces extends CFStartAction implements PaginatedAction, EntityInlineParentAction, EntityInlineChildAction {
  public schemaKey: string;
  constructor(
    public paginationKey: string,
    public orgGuid: string,
    public endpointGuid: string,
    public includeRelations = [],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${orgGuid}/spaces`;
    this.options.method = 'get';
    this.parentGuid = orgGuid;
  }
  actions = [GET_ORGANIZATION_SPACES, GET_ORGANIZATION_SPACES_SUCCESS, GET_ORGANIZATION_SPACES_FAILED];
  entity = cfEntityFactory(spaceEntityType);
  entityType = spaceEntityType;
  options: RequestOptions;
  flattenPagination = true;
  initialParams = {
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name'
  };
  parentGuid: string;
  parentEntityConfig = new CFEntityConfig(organizationEntityType);
}

export class GetAllOrganizationSpacesWithOrgs extends GetAllOrganizationSpaces {
  entity = cfEntityFactory(spaceWithOrgEntityType);
  entityType = spaceEntityType;
  schemaKey = spaceWithOrgEntityType;
}

export class GetAllOrganizationDomains extends CFStartAction implements PaginatedAction, EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public orgGuid: string,
    public endpointGuid: string,
    public paginationKey: string = null,
    public includeRelations = [],
    public populateMissing = true
  ) {
    super();
    if (!this.paginationKey) {
      this.paginationKey = createEntityRelationPaginationKey(organizationEntityType, orgGuid);
    }
    this.options = new RequestOptions();
    this.options.url = `organizations/${orgGuid}/domains`;
    this.options.method = 'get';
    this.parentGuid = orgGuid;
  }
  actions = [GET_ORGANIZATION_DOMAINS, GET_ORGANIZATION_DOMAINS_SUCCESS, GET_ORGANIZATION_DOMAINS_FAILED];
  entity = cfEntityFactory(domainEntityType);
  entityType = domainEntityType;
  options: RequestOptions;
  flattenPagination = true;
  initialParams = {
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name'
  };
  parentGuid: string;
  parentEntityConfig = new CFEntityConfig(organizationEntityType);
}

export class GetAllOrganizations extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(
    public paginationKey: string,
    public endpointGuid: string = null,
    public includeRelations: string[] = [],
    public populateMissing = true
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'organizations';
    this.options.method = 'get';
  }
  actions = [
    GET_ORGANIZATIONS,
    GET_ORGANIZATIONS_SUCCESS,
    GET_ORGANIZATIONS_FAILED
  ];
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'name',
    'order-by': 'name'
  };
  flattenPagination = true;
}

export class DeleteOrganization extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.append('recursive', 'true');
    this.options.params.append('async', 'false');
  }
  actions = [DELETE_ORGANIZATION, DELETE_ORGANIZATION_SUCCESS, DELETE_ORGANIZATION_FAILED];
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: RequestOptions;
  removeEntityOnDelete = true;
}

export class CreateOrganization extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public createOrg: IUpdateOrganization) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations`;
    this.options.method = RequestMethod.Post;
    this.options.body = createOrg;
    this.guid = createOrg.name;
  }
  actions = getActions('Organizations', 'Create Org');
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: RequestOptions;
  guid: string;
}

export class UpdateOrganization extends CFStartAction implements ICFAction {

  public static UpdateExistingOrg = 'Updating-Existing-Org';
  constructor(public guid: string, public endpointGuid: string, updateOrg: IUpdateOrganization) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${guid}`;
    this.options.method = 'put';
    this.options.body = updateOrg;
  }
  actions = getActions('Organizations', 'Update Org');
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: RequestOptions;
  updatingKey = UpdateOrganization.UpdateExistingOrg;
}

export class GetAllOrgUsers extends CFStartAction implements PaginatedAction, EntityInlineParentAction {

  constructor(
    public guid: string,
    public paginationKey: string,
    public endpointGuid: string,
    public isAdmin: boolean,
    public includeRelations: string[] = createDefaultUserRelations()) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${guid}/users`;
    this.options.method = 'get';
    // Only admin's can use the url supplied by cf to fetch missing params. These are used by validation and fail for non-admins
    this.skipValidation = !isAdmin;
    this.populateMissing = !isAdmin;
  }
  actions = [
    GET_ORGANIZATION_USERS,
    GET_ORGANIZATION_USERS_SUCCESS,
    GET_ORGANIZATION_USERS_FAILED
  ];
  entity = [cfEntityFactory(cfUserEntityType)];
  entityType = cfUserEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'username',
  };
  flattenPagination = true;
  flattenPaginationMax = 600;
  skipValidation: boolean;
  populateMissing: boolean;
}
