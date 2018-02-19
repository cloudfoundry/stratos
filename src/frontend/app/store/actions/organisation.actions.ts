import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { getAPIResourceGuid } from '../selectors/api.selectors';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import {
  EntityInlineChildAction,
  EntityInlineParent,
  OrganisationSchema,
  organisationSchemaKey,
  spaceSchemaKey,
  EntityInlineChild,
  SpaceSchema,
} from './action-types';
import { getActions } from './action.helper';
import { pathGet } from '../../core/utils.service';

export const GET_ORGANISATION = '[Organisation] Get one';
export const GET_ORGANISATION_SUCCESS = '[Organisation] Get one success';
export const GET_ORGANISATION_FAILED = '[Organisation] Get one failed';

export const GET_ORGANISATIONS = '[Organisation] Get all';
export const GET_ORGANISATIONS_SUCCESS = '[Organisation] Get all success';
export const GET_ORGANISATIONS_FAILED = '[Organisation] Get all failed';

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

export const SpacesSchema = new EntityInlineChild([
  {
    parentEntityKey: organisationSchemaKey,
    childEntityKey: spaceSchemaKey,
    mergeResult: (state, parentGuid, response) => {
      const parentEntity = pathGet(`${organisationSchemaKey}.${parentGuid}`, state);
      const newParentEntity = {
        ...parentEntity,
        entity: {
          ...parentEntity.entity,
          spaces: response.result
        }
      };
      return {
        parentGuid,
        newParentEntity
      };
    },
    createAction: (organisation) => {
      return new GetAllOrganisationSpaces(
        `${organisationSchemaKey}-${organisation.metadata.guid}`,
        organisation.metadata.guid,
        organisation.entity.cfGuid);
    }
  },
], SpaceSchema);

export class GetAllOrganisationSpaces extends CFStartAction implements PaginatedAction, EntityInlineChildAction {
  constructor(public paginationKey: string, public orgGuid: string, public cnsi: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `organizations/${orgGuid}/spaces`;
    this.options.method = 'get';
    this.parentGuid = orgGuid;
  }
  actions = [GET_ORGANISATION_SPACES, GET_ORGANISATION_SPACES_SUCCESS, GET_ORGANISATION_SPACES_FAILED];
  entity = SpacesSchema;
  entityKey = spaceSchemaKey;
  options: RequestOptions;
  flattenPagination = true;
  initialParams = {
    'results-per-page': 100,
    'inline-relations-depth': '1'
  };
  parentGuid: string;
}

export const OrganisationWithSpaceSchema = new schema.Entity(organisationSchemaKey, {
  entity: {
    spaces: SpacesSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

export const SpaceWithOrganisationSchema = new schema.Entity(spaceSchemaKey, {
  entity: {
    organization: OrganisationSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

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
  entity = [OrganisationSchema];
  entityKey = organisationSchemaKey;
  options: RequestOptions;
}
