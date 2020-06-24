import { HttpParams, HttpRequest } from '@angular/common/http';

import { getActions } from '../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { IUpdateOrganization } from '../cf-api.types';
import { cfEntityFactory } from '../cf-entity-factory';
import {
  cfUserEntityType,
  domainEntityType,
  organizationEntityType,
  spaceEntityType,
  spaceWithOrgEntityType,
} from '../cf-entity-types';
import { CFEntityConfig } from '../cf-types';
import {
  createEntityRelationPaginationKey,
  EntityInlineChildAction,
  EntityInlineParentAction,
} from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';
import { createDefaultCfUserRelations } from './users.actions';

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
    this.options = new HttpRequest(
      'GET',
      `organizations/${guid}`
    );
  }
  actions = [
    GET_ORGANIZATION,
    GET_ORGANIZATION_SUCCESS,
    GET_ORGANIZATION_FAILED
  ];
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'GET',
      `organizations/${orgGuid}/spaces`
    );
    this.parentGuid = orgGuid;
  }
  actions = [GET_ORGANIZATION_SPACES, GET_ORGANIZATION_SPACES_SUCCESS, GET_ORGANIZATION_SPACES_FAILED];
  entity = cfEntityFactory(spaceEntityType);
  entityType = spaceEntityType;
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'GET',
      `organizations/${orgGuid}/domains`
    );
    this.parentGuid = orgGuid;
  }
  actions = [GET_ORGANIZATION_DOMAINS, GET_ORGANIZATION_DOMAINS_SUCCESS, GET_ORGANIZATION_DOMAINS_FAILED];
  entity = cfEntityFactory(domainEntityType);
  entityType = domainEntityType;
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'GET',
      'organizations'
    );
  }
  actions = [
    GET_ORGANIZATIONS,
    GET_ORGANIZATIONS_SUCCESS,
    GET_ORGANIZATIONS_FAILED
  ];
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: HttpRequest<any>;
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
    this.options = new HttpRequest(
      'DELETE',
      `organizations/${guid}`,
      {
        params: new HttpParams({
          fromObject: {
            recursive: 'true',
            async: 'false'
          }
        })
      }
    );
  }
  actions = [DELETE_ORGANIZATION, DELETE_ORGANIZATION_SUCCESS, DELETE_ORGANIZATION_FAILED];
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: HttpRequest<any>;
  removeEntityOnDelete = true;
}

export class CreateOrganization extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public createOrg: IUpdateOrganization) {
    super();
    this.options = new HttpRequest(
      'POST',
      'organizations',
      createOrg
    );
    this.guid = createOrg.name;
  }
  actions = getActions('Organizations', 'Create Org');
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: HttpRequest<any>;
  guid: string;
}

export class UpdateOrganization extends CFStartAction implements ICFAction {

  public static UpdateExistingOrg = 'Updating-Existing-Org';
  constructor(public guid: string, public endpointGuid: string, updateOrg: IUpdateOrganization) {
    super();
    this.options = new HttpRequest(
      'PUT',
      `organizations/${guid}`,
      updateOrg
    );
  }
  actions = getActions('Organizations', 'Update Org');
  entity = [cfEntityFactory(organizationEntityType)];
  entityType = organizationEntityType;
  options: HttpRequest<any>;
  updatingKey = UpdateOrganization.UpdateExistingOrg;
}

export class GetAllOrgUsers extends CFStartAction implements PaginatedAction, EntityInlineParentAction {

  constructor(
    public guid: string,
    public paginationKey: string,
    public endpointGuid: string,
    public isAdmin: boolean,
    public includeRelations: string[] = createDefaultCfUserRelations()) {
    super();
    this.options = new HttpRequest(
      'GET',
      `organizations/${guid}/users`
    );
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
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'desc',
    'order-direction-field': 'username',
  };
  flattenPagination = true;
  flattenPaginationMax = true;
  skipValidation: boolean;
  populateMissing: boolean;
}
