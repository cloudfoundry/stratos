import { RequestMethod, RequestOptions, URLSearchParams } from '@angular/http';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { CFEntityConfig } from '../../cf-types';
import {
  cfEntityFactory,
  organizationEntityType,
  quotaDefinitionEntityType,
  spaceQuotaEntityType,
} from '../cf-entity-factory';
import { CFStartAction } from './cf-action.types';
import { EntityInlineChildAction, EntityInlineParentAction } from '../entity-relations/entity-relations.types';


export const GET_QUOTA_DEFINITION = '[QuotaDefinition] Get one';
export const GET_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinition] Get one success';
export const GET_QUOTA_DEFINITION_FAILED = '[QuotaDefinition] Get one failed';

export const GET_SPACE_QUOTA_DEFINITION = '[SpaceQuotaDefinition] Get one';
export const GET_SPACE_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinition] Get one success';
export const GET_SPACE_QUOTA_DEFINITION_FAILED = '[QuotaDefinition] Get one failed';

export const GET_QUOTA_DEFINITIONS = '[QuotaDefinitions] Get all';
export const GET_QUOTA_DEFINITIONS_SUCCESS = '[QuotaDefinitions] Get all success';
export const GET_QUOTA_DEFINITIONS_FAILED = '[QuotaDefinitions] Get all failed';

export const GET_SPACE_QUOTA_DEFINITIONS = '[QuotaDefinitions] Get all space quota definitions';
export const GET_SPACE_QUOTA_DEFINITIONS_SUCCESS = '[QuotaDefinitions] Get all space quota definitions success';
export const GET_SPACE_QUOTA_DEFINITIONS_FAILED = '[QuotaDefinitions] Get all space quota definitions failed';

export const ASSOCIATE_SPACE_QUOTA_DEFINITION = '[QuotaDefinitions] Associate space quota definition';
export const ASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinitions] Associate space quota definition success';
export const ASSOCIATE_SPACE_QUOTA_DEFINITION_FAILED = '[QuotaDefinitions] Associate space quota definition failed';

export const DISASSOCIATE_SPACE_QUOTA_DEFINITION = '[QuotaDefinitions] Disassociate space quota definition';
export const DISASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinitions] Disassociate space quota definition success';
export const DISASSOCIATE_SPACE_QUOTA_DEFINITION_FAILED = '[QuotaDefinitions] Disassociate space quota definition failed';

// const quotaDefinitionEntitySchema = entityFactory(quotaDefinitionSchemaKey);
// const spaceQuotaEntitySchema = entityFactory(spaceQuotaSchemaKey);

export class GetQuotaDefinitions extends CFStartAction implements PaginatedAction {
  constructor(
    public paginationKey: string,
    public endpointGuid: string = null,
    public includeRelations: string[] = [],
    public populateMissing = false
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'quota_definitions';
    this.options.method = RequestMethod.Get;
  }
  actions = [
    GET_QUOTA_DEFINITIONS,
    GET_QUOTA_DEFINITIONS_SUCCESS,
    GET_QUOTA_DEFINITIONS_FAILED
  ];
  entity = [cfEntityFactory(quotaDefinitionEntityType)];
  entityType = quotaDefinitionEntityType;
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'asc',
  };
  flattenPagination = true;
}

export class GetQuotaDefinition extends CFStartAction implements ICFAction, EntityInlineParentAction {
  constructor(public guid: string, public endpointGuid: string, public includeRelations = [], public populateMissing = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = `quota_definitions/${guid}`;
    this.options.method = RequestMethod.Get;
  }
  actions = [
    GET_QUOTA_DEFINITION,
    GET_QUOTA_DEFINITION_SUCCESS,
    GET_QUOTA_DEFINITION_FAILED
  ];
  entity = [cfEntityFactory(quotaDefinitionEntityType)];
  entityType = quotaDefinitionEntityType;
  options: RequestOptions;
}

export class GetSpaceQuotaDefinition extends CFStartAction implements ICFAction, EntityInlineParentAction {
  constructor(public guid: string, public endpointGuid: string, public includeRelations = [], public populateMissing = true) {
    super();
    this.options = new RequestOptions();
    this.options.url = `space_quota_definitions/${guid}`;
    this.options.method = RequestMethod.Get;
  }
  actions = [
    GET_SPACE_QUOTA_DEFINITION,
    GET_SPACE_QUOTA_DEFINITION_SUCCESS,
    GET_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [cfEntityFactory(spaceQuotaEntityType)];
  entityType = spaceQuotaEntityType;
  options: RequestOptions;
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
    this.options = new RequestOptions();
    this.options.url = `organizations/${orgGuid}/space_quota_definitions`;
    this.options.method = RequestMethod.Get;
    this.options.params = new URLSearchParams();
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
  options: RequestOptions;
  initialParams = {
    page: 1,
    'results-per-page': 100,
    'order-direction': 'asc',
  };
  flattenPagination = true;
}

export class AssociateSpaceQuota extends CFStartAction implements ICFAction {
  public static UpdateExistingSpaceQuota = 'Updating-Existing-Space-Quota';

  constructor(public spaceGuid: string, public endpointGuid: string, spaceQuotaGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `space_quota_definitions/${spaceQuotaGuid}/spaces/${spaceGuid}`;
    this.options.method = RequestMethod.Put;
    this.guid = spaceQuotaGuid;
  }
  actions = [
    ASSOCIATE_SPACE_QUOTA_DEFINITION,
    ASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS,
    ASSOCIATE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [cfEntityFactory(spaceQuotaEntityType)];
  entityType = spaceQuotaEntityType;
  options: RequestOptions;
  updatingKey = AssociateSpaceQuota.UpdateExistingSpaceQuota;
  guid: string;
}

export class DisassociateSpaceQuota extends CFStartAction implements ICFAction {
  public static UpdateExistingSpaceQuota = 'Updating-Existing-Space-Quota';

  constructor(public spaceGuid: string, public endpointGuid: string, spaceQuotaGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `space_quota_definitions/${spaceQuotaGuid}/spaces/${spaceGuid}`;
    this.options.method = RequestMethod.Delete;
    this.guid = spaceQuotaGuid;
  }
  actions = [
    DISASSOCIATE_SPACE_QUOTA_DEFINITION,
    DISASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS,
    DISASSOCIATE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [cfEntityFactory(spaceQuotaEntityType)];
  entityType = spaceQuotaEntityType;
  options: RequestOptions;
  updatingKey = AssociateSpaceQuota.UpdateExistingSpaceQuota;
  guid: string;
}
