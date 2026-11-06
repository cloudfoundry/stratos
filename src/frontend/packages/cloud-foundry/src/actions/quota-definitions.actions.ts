import { HttpRequest } from '@angular/common/http';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { organizationEntityType, quotaDefinitionEntityType, spaceQuotaEntityType } from '../cf-entity-types';
import { CFEntityConfig } from '../cf-types';
import { EntityInlineChildAction, EntityInlineParentAction } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

export const GET_QUOTA_DEFINITION = '[QuotaDefinition] Get one';
export const GET_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinition] Get one success';
export const GET_QUOTA_DEFINITION_FAILED = '[QuotaDefinition] Get one failed';

export const GET_QUOTA_DEFINITIONS = '[QuotaDefinitions] Get all';
export const GET_QUOTA_DEFINITIONS_SUCCESS = '[QuotaDefinitions] Get all success';
export const GET_QUOTA_DEFINITIONS_FAILED = '[QuotaDefinitions] Get all failed';

export const GET_SPACE_QUOTA_DEFINITIONS = '[QuotaDefinitions] Get all space quota definitions';
export const GET_SPACE_QUOTA_DEFINITIONS_SUCCESS = '[QuotaDefinitions] Get all space quota definitions success';
export const GET_SPACE_QUOTA_DEFINITIONS_FAILED = '[QuotaDefinitions] Get all space quota definitions failed';

export class GetQuotaDefinitions extends CFStartAction implements PaginatedAction {
  constructor(
    public paginationKey: string,
    public endpointGuid?: string,
    public includeRelations: string[] = [],
    public populateMissing = false
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/organization_quotas/${endpointGuid}`
    );
  }
  actions = [
    GET_QUOTA_DEFINITIONS,
    GET_QUOTA_DEFINITIONS_SUCCESS,
    GET_QUOTA_DEFINITIONS_FAILED
  ];
  entity = [cfEntityFactory(quotaDefinitionEntityType)];
  entityType = quotaDefinitionEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'asc',
  };
  flattenPagination = true;
}

export class GetQuotaDefinition extends CFStartAction implements ICFAction, EntityInlineParentAction {
  constructor(public guid: string, public endpointGuid: string, public includeRelations: string[] = [], public populateMissing = true) {
    super();
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/organization_quotas/${endpointGuid}/${guid}`
    );
  }
  actions = [
    GET_QUOTA_DEFINITION,
    GET_QUOTA_DEFINITION_SUCCESS,
    GET_QUOTA_DEFINITION_FAILED
  ];
  entity = [cfEntityFactory(quotaDefinitionEntityType)];
  entityType = quotaDefinitionEntityType;
  options: HttpRequest<any>;
}

export class GetOrganizationSpaceQuotaDefinitions extends CFStartAction implements PaginatedAction, EntityInlineChildAction {
  parentGuid: string;

  constructor(
    public paginationKey: string,
    public orgGuid: string,
    public endpointGuid: string,
    public includeRelations: string[] = [],
    public populateMissing = true
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      `/pp/v1/cf/space_quotas/${endpointGuid}`
    );
    this.parentGuid = this.orgGuid;
  }
  actions = [
    GET_SPACE_QUOTA_DEFINITIONS,
    GET_SPACE_QUOTA_DEFINITIONS_SUCCESS,
    GET_SPACE_QUOTA_DEFINITIONS_FAILED
  ];
  parentEntityConfig = new CFEntityConfig(organizationEntityType);
  entity = [cfEntityFactory(spaceQuotaEntityType)];
  entityType = spaceQuotaEntityType;
  options: HttpRequest<any>;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'asc',
  };
  flattenPagination = true;
}
