import { RequestOptions, URLSearchParams } from '@angular/http';

import { IUpdateOrganization } from '../../core/cf-api.types';
import {
  entityFactory,
  organisationSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../helpers/entity-factory';
import { EntityInlineChildAction, EntityInlineParentAction } from '../helpers/entity-relations.types';
import { PaginatedAction, PaginationAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { getActions } from './action.helper';

export const GET_ORGANISATION = '[Organisation] Get one';
export const GET_ORGANISATION_SUCCESS = '[Organisation] Get one success';
export const GET_ORGANISATION_FAILED = '[Organisation] Get one failed';

export const GET_ORGANISATIONS = '[Organisation] Get all';
export const GET_ORGANISATIONS_SUCCESS = '[Organisation] Get all success';
export const GET_ORGANISATIONS_FAILED = '[Organisation] Get all failed';

export const GET_ORGANISATION_SPACES = '[Space] Get all org spaces';
export const GET_ORGANISATION_SPACES_SUCCESS = '[Space] Get all org spaces success';
export const GET_ORGANISATION_SPACES_FAILED = '[Space] Get all org spaces failed';

export class GetOrganisation extends CFStartAction implements ICFAction, EntityInlineParentAction {
  constructor(public guid: string,
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
    GET_ORGANISATION,
    GET_ORGANISATION_SUCCESS,
    GET_ORGANISATION_FAILED
  ];
  entity = [entityFactory(organisationSchemaKey)];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
}

export class GetAllOrganisationSpaces extends CFStartAction implements PaginatedAction, EntityInlineParentAction, EntityInlineChildAction {
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
  actions = [GET_ORGANISATION_SPACES, GET_ORGANISATION_SPACES_SUCCESS, GET_ORGANISATION_SPACES_FAILED];
  entity = entityFactory(spaceSchemaKey);
  entityKey = spaceSchemaKey;
  options: RequestOptions;
  flattenPagination = true;
  initialParams = {
    'results-per-page': 100,
  };
  parentGuid: string;
  parentEntitySchema = entityFactory(organisationSchemaKey);
}

export class GetAllOrganisations extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
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
    GET_ORGANISATIONS,
    GET_ORGANISATIONS_SUCCESS,
    GET_ORGANISATIONS_FAILED
  ];
  entity = [entityFactory(organisationSchemaKey)];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
  };
  flattenPagination = true;
}

export class DeleteOrganisation extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.append('recursive', 'true');
    this.options.params.append('async', 'false');
  }
  actions = getActions('Organisations', 'Delete Org');
  entity = [entityFactory(organisationSchemaKey)];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
}

export class CreateOrganization extends CFStartAction implements ICFAction {
  constructor(public name: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations`;
    this.options.method = 'post';
    this.guid = name;
    this.options.body = {
      name: name
    };
  }
  actions = getActions('Organisations', 'Create Org');
  entity = [entityFactory(organisationSchemaKey)];
  entityKey = organisationSchemaKey;
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
  actions = getActions('Spaces', 'Update Space');
  entity = [entityFactory(organisationSchemaKey)];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
  updatingKey = UpdateOrganization.UpdateExistingOrg;
}
