import { RequestMethod, RequestOptions, URLSearchParams } from '@angular/http';

import { IQuotaDefinition } from '../../../core/src/core/cf-api.types';
import {
  entityFactory,
  organizationSchemaKey,
  quotaDefinitionSchemaKey,
  spaceQuotaSchemaKey,
} from '../helpers/entity-factory';
import { EntityInlineChildAction, EntityInlineParentAction } from '../helpers/entity-relations/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, ICFAction } from '../types/request.types';

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

export const CREATE_QUOTA_DEFINITION = '[QuotaDefinitions] Create quota definition';
export const CREATE_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinitions] Create quota definition success';
export const CREATE_QUOTA_DEFINITION_FAILED = '[QuotaDefinitions] Create quota definition failed';

export const UPDATE_QUOTA_DEFINITION = '[QuotaDefinitions] Update quota definition';
export const UPDATE_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinitions] Update quota definition success';
export const UPDATE_QUOTA_DEFINITION_FAILED = '[QuotaDefinitions] Update quota definition failed';

export const DELETE_QUOTA_DEFINITION = '[QuotaDefinitions] Delete quota definition';
export const DELETE_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinitions] Delete quota definition success';
export const DELETE_QUOTA_DEFINITION_FAILED = '[QuotaDefinitions] Delete quota definition failed';

export const CREATE_SPACE_QUOTA_DEFINITION = '[QuotaDefinitions] Create space quota definition';
export const CREATE_SPACE_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinitions] Create space quota definition success';
export const CREATE_SPACE_QUOTA_DEFINITION_FAILED = '[QuotaDefinitions] Create space quota definition failed';

export const UPDATE_SPACE_QUOTA_DEFINITION = '[QuotaDefinitions] Update space quota definition';
export const UPDATE_SPACE_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinitions] Update space quota definition success';
export const UPDATE_SPACE_QUOTA_DEFINITION_FAILED = '[QuotaDefinitions] Update space quota definition failed';

export const DELETE_SPACE_QUOTA_DEFINITION = '[QuotaDefinitions] Delete space quota definition';
export const DELETE_SPACE_QUOTA_DEFINITION_SUCCESS = '[QuotaDefinitions] Delete space quota definition success';
export const DELETE_SPACE_QUOTA_DEFINITION_FAILED = '[QuotaDefinitions] Delete space quota definition failed';

const quotaDefinitionEntitySchema = entityFactory(quotaDefinitionSchemaKey);
const spaceQuotaEntitySchema = entityFactory(spaceQuotaSchemaKey);

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
  entity = [quotaDefinitionEntitySchema];
  entityKey = quotaDefinitionSchemaKey;
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
  entity = [quotaDefinitionEntitySchema];
  entityKey = quotaDefinitionSchemaKey;
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
  entity = [spaceQuotaEntitySchema];
  entityKey = spaceQuotaSchemaKey;
  options: RequestOptions;
}

export class GetOrganizationSpaceQuotaDefinitions extends CFStartAction implements PaginatedAction, EntityInlineChildAction {
  parentGuid: string;

  constructor(
    public paginationKey: string,
    public orgGuid: string,
    public endpointGuid: string,
    public includeRelations: string[] = [],
    public populateMissing = true) {
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
  parentEntitySchema = entityFactory(organizationSchemaKey);
  entity = [entityFactory(spaceQuotaSchemaKey)];
  entityKey = spaceQuotaSchemaKey;
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
  entity = [entityFactory(spaceQuotaSchemaKey)];
  entityKey = spaceQuotaSchemaKey;
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
  entity = [entityFactory(spaceQuotaSchemaKey)];
  entityKey = spaceQuotaSchemaKey;
  options: RequestOptions;
  updatingKey = AssociateSpaceQuota.UpdateExistingSpaceQuota;
  guid: string;
}

export class CreateQuotaDefinition extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public createQuota: IQuotaDefinition) {
    super();
    this.options = new RequestOptions();
    this.options.url = `quota_definitions`;
    this.options.method = RequestMethod.Post;
    this.options.body = createQuota;
    this.guid = createQuota.name;
  }
  actions = [
    CREATE_QUOTA_DEFINITION,
    CREATE_QUOTA_DEFINITION_SUCCESS,
    CREATE_QUOTA_DEFINITION_FAILED
  ];
  entity = [quotaDefinitionEntitySchema];
  entityKey = quotaDefinitionSchemaKey;
  options: RequestOptions;
  guid: string;
}

export class UpdateQuotaDefinition extends CFStartAction implements ICFAction {

  public static UpdateExistingQuota = 'Updating-Existing-Quota';

  constructor(public guid: string, public endpointGuid: string, updateQuota: IQuotaDefinition) {
    super();
    this.options = new RequestOptions();
    this.options.url = `quota_definitions/${guid}`;
    this.options.method = RequestMethod.Put;
    this.options.body = updateQuota;
  }
  actions = [
    UPDATE_QUOTA_DEFINITION,
    UPDATE_QUOTA_DEFINITION_SUCCESS,
    UPDATE_QUOTA_DEFINITION_FAILED
  ];
  entity = [quotaDefinitionEntitySchema];
  entityKey = quotaDefinitionSchemaKey;
  options: RequestOptions;
  updatingKey = UpdateQuotaDefinition.UpdateExistingQuota;
}

export class DeleteQuotaDefinition extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `quota_definitions/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.append('recursive', 'true');
    this.options.params.append('async', 'false');
  }
  actions = [
    DELETE_QUOTA_DEFINITION,
    DELETE_QUOTA_DEFINITION_SUCCESS,
    DELETE_QUOTA_DEFINITION_FAILED
  ];
  entity = [quotaDefinitionEntitySchema];
  entityKey = quotaDefinitionSchemaKey;
  options: RequestOptions;
  removeEntityOnDelete = true;
}

export class CreateSpaceQuotaDefinition extends CFStartAction implements ICFAction {
  constructor(public endpointGuid: string, public createQuota: IQuotaDefinition) {
    super();
    this.options = new RequestOptions();
    this.options.url = `space_quota_definitions`;
    this.options.method = RequestMethod.Post;
    this.options.body = createQuota;
    this.guid = createQuota.name;
  }
  actions = [
    CREATE_SPACE_QUOTA_DEFINITION,
    CREATE_SPACE_QUOTA_DEFINITION_SUCCESS,
    CREATE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [spaceQuotaEntitySchema];
  entityKey = spaceQuotaSchemaKey;
  options: RequestOptions;
  guid: string;
}

export class UpdateSpaceQuotaDefinition extends CFStartAction implements ICFAction {

  public static UpdateExistingSpaceQuota = 'Updating-Existing-Space-Quota';

  constructor(public guid: string, public endpointGuid: string, updateQuota: IQuotaDefinition) {
    super();
    this.options = new RequestOptions();
    this.options.url = `space_quota_definitions/${guid}`;
    this.options.method = RequestMethod.Put;
    this.options.body = updateQuota;
  }
  actions = [
    UPDATE_SPACE_QUOTA_DEFINITION,
    UPDATE_SPACE_QUOTA_DEFINITION_SUCCESS,
    UPDATE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [spaceQuotaEntitySchema];
  entityKey = spaceQuotaSchemaKey;
  options: RequestOptions;
  updatingKey = UpdateSpaceQuotaDefinition.UpdateExistingSpaceQuota;
}

export class DeleteSpaceQuotaDefinition extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new RequestOptions();
    this.options.url = `space_quota_definitions/${guid}`;
    this.options.method = 'delete';
    this.options.params = new URLSearchParams();
    this.options.params.append('recursive', 'true');
    this.options.params.append('async', 'false');
  }
  actions = [
    DELETE_SPACE_QUOTA_DEFINITION,
    DELETE_SPACE_QUOTA_DEFINITION_SUCCESS,
    DELETE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [spaceQuotaEntitySchema];
  entityKey = spaceQuotaSchemaKey;
  options: RequestOptions;
  removeEntityOnDelete = true;
}
