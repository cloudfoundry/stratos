import { RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { pathGet } from '../../core/utils.service';
import {
  EntityInlineChild,
  EntityInlineChildAction,
  EntityInlineParentAction,
  EntityRelation,
} from '../helpers/entity-relations.helpers';
import { getAPIResourceGuid } from '../selectors/api.selectors';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';
import { OrganisationSchema, organisationSchemaKey, spaceSchemaKey, QuotaDefinitionSchema } from './action-types';
import { getActions } from './action.helper';
import { SpaceSchema } from './space.actions';

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

export const OrgSpaceRelation: EntityRelation = {
  key: 'org-space-relation',
  parentEntityKey: organisationSchemaKey,
  childEntity: SpaceSchema,
  createParentWithChild: (state, parentGuid, response) => {
    const parentEntity = pathGet(`${organisationSchemaKey}.${parentGuid}`, state);
    const newParentEntity = {
      ...parentEntity,
      entity: {
        ...parentEntity.entity,
        spaces: response.result
      }
    };
    return newParentEntity;
  },
  fetchChildrenAction: (organisation, includeRelations, populateMissing) => {
    // GetAllOrganisationSpaces uses SpacesSchema. SpacesSchema uses GetAllOrganisationSpaces.
    // tslint:disable-next-line:no-use-before-declare
    return new GetAllOrganisationSpaces(
      EntityRelation.createPaginationKey(organisationSchemaKey, organisation.metadata.guid),
      organisation.metadata.guid,
      organisation.entity.cfGuid,
      includeRelations,
      populateMissing);
  },
};

export const SpacesSchema = new EntityInlineChild([OrgSpaceRelation], SpaceSchema);

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
    quota_definition: QuotaDefinitionSchema,
    spaces: SpacesSchema
  }
}, {
    idAttribute: getAPIResourceGuid
  });

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
