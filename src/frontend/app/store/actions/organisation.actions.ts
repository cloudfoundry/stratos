import { RequestOptions, URLSearchParams } from '@angular/http';

import { entityFactory } from '../helpers/entity-factory';
import { EntityInlineChildAction, EntityInlineParentAction } from '../helpers/entity-relations.helpers';
import { organisationSchemaKey, organisationWithSpaceKey, spaceSchemaKey, spacesKey } from '../helpers/entity-factory';
import { PaginatedAction } from '../types/pagination.types';
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
    public populateMissing = false) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organization/${guid}`;
    this.options.method = 'get';
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
    public cnsi: string,
    public includeRelations = [],
    public populateMissing = false
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${orgGuid}/spaces`;
    this.options.method = 'get';
    this.parentGuid = orgGuid;
  }
  actions = [GET_ORGANISATION_SPACES, GET_ORGANISATION_SPACES_SUCCESS, GET_ORGANISATION_SPACES_FAILED];
  entity = entityFactory(spacesKey);
  entityKey = spaceSchemaKey;
  options: RequestOptions;
  flattenPagination = true;
  initialParams = {
    'results-per-page': 100,
    'inline-relations-depth': '1'
  };
  parentGuid: string;
}



export class GetAllOrganisations extends CFStartAction implements PaginatedAction, EntityInlineParentAction {
  constructor(public paginationKey: string, public includeRelations: string[] = [], public populateMissing = false) {
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
  entity = [entityFactory(organisationWithSpaceKey)];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 2
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
