import { RequestOptions } from '@angular/http';

import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import {
  OrganisationSchema,
  organisationSchemaKey,
  OrganisationWithSpaceSchema,
  spaceSchemaKey,
  SpaceWithOrganisationSchema,
} from './action-types';

export const GET_ORGANISATION = '[Organisation] Get one';
export const GET_ORGANISATION_SUCCESS = '[Organisation] Get one success';
export const GET_ORGANISATION_FAILED = '[Organisation] Get one failed';

export const GET_ORGANISATIONS = '[Organization] Get all';
export const GET_ORGANISATIONS_SUCCESS = '[Organization] Get all success';
export const GET_ORGANISATIONS_FAILED = '[Organization] Get all failed';

export const GET_ORGANISATION_SPACES = '[Space] Get all org spaces';
export const GET_ORGANISATION_SPACES_SUCCESS = '[Space] Get all org spaces success';
export const GET_ORGANISATION_SPACES_FAILED = '[Space] Get all org spaces failed';

export class GetOrganisation extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
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
  entity = [OrganisationSchema];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
}

export class GetAllOrganisations extends CFStartAction implements PaginatedAction {
  constructor(public paginationKey: string) {
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
  entity = [OrganisationWithSpaceSchema];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 1
  };
  flattenPagination = true;
  validateResponse = [
    {
      path: 'entity.spaces',
      createAction: (organisation) => {
        return new GetAllOrganisationSpaces(`org-${organisation.metadata.guid}`, organisation.metadata.guid, organisation.entity.cfGuid);
      }
    }
  ];
}

export class GetAllOrganisationSpaces extends CFStartAction implements PaginatedAction {
  constructor(public paginationKey: string, public orgGuid: string, public cnsi: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${orgGuid}/spaces`;
    this.options.method = 'get';
  }
  actions = [GET_ORGANISATION_SPACES, GET_ORGANISATIONS_SUCCESS, GET_ORGANISATIONS_FAILED];
  entity = [SpaceWithOrganisationSchema];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
  flattenPagination = true;
  initialParams = {
    'results-per-page': 100,
    'inline-relations-depth': '1'
  };
}
