import { RequestOptions, URLSearchParams } from '@angular/http';

import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import {
  OrganisationSchema,
  organisationSchemaKey,
  OrganisationWithSpaceSchema
} from './action-types';
import { getActions } from './action.helper';

export const GET_ORGANISATION = '[Organisation] Get one';
export const GET_ORGANISATION_SUCCESS = '[Organisation] Get one success';
export const GET_ORGANISATION_FAILED = '[Organisation] Get one failed';

export const GET_ORGANISATIONS = '[Organisation] Get all';
export const GET_ORGANISATIONS_SUCCESS = '[Organisation] Get all success';
export const GET_ORGANISATIONS_FAILED = '[Organisation] Get all failed';

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

export class GetAllOrganisations extends CFStartAction
  implements PaginatedAction {
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
    'inline-relations-depth': 2
  };
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
  entity = [OrganisationSchema];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
}
