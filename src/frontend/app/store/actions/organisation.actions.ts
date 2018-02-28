import { RequestOptions, URLSearchParams } from '@angular/http';

import { PaginatedAction, PaginationAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import {
  OrganisationSchema,
  organisationSchemaKey,
  OrganisationWithSpaceSchema,
  spaceSchemaKey,
  SpaceWithOrganisationSchema,
} from './action-types';
import { getActions } from './action.helper';
import { IUpdateOrganization } from '../../core/cf-api.types';

export const GET_ORGANISATION = '[Organisation] Get one';
export const GET_ORGANISATION_SUCCESS = '[Organisation] Get one success';
export const GET_ORGANISATION_FAILED = '[Organisation] Get one failed';

export const GET_ORGANISATIONS = '[Organisation] Get all';
export const GET_ORGANISATIONS_SUCCESS = '[Organisation] Get all success';
export const GET_ORGANISATIONS_FAILED = '[Organisation] Get all failed';


export class GetOrganisation extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string, private withInlineDepth = 0) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${guid}`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    if (withInlineDepth !== 0) {
      this.options.params.append('inline-relations-depth', '' + withInlineDepth);
    }
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
  constructor(public paginationKey: string, public endpointGuid: string = null) {
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
  entity = [OrganisationSchema];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
  guid: string;
}

export class GetAllSpacesInOrg extends CFStartAction implements PaginationAction {
  constructor(public cfGuid: string, public orgGuid: string, public paginationKey: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${orgGuid}/spaces`;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  actions = getActions('Organisations', 'Get Spaces');
  entity = [SpaceWithOrganisationSchema];
  entityKey = spaceSchemaKey;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'inline-relations-depth': 2
  };
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
  entity = [OrganisationSchema];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
  updatingKey = UpdateOrganization.UpdateExistingOrg;
}
