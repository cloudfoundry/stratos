import { HttpParams, HttpRequest } from '@angular/common/http';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { IQuotaDefinition } from '../cf-api.types';
import { cfEntityFactory } from '../cf-entity-factory';
import { organizationEntityType, quotaDefinitionEntityType, spaceQuotaEntityType } from '../cf-entity-types';
import { CFEntityConfig } from '../cf-types';
import { EntityInlineChildAction, EntityInlineParentAction } from '../entity-relations/entity-relations.types';
import { QuotaFormValues } from '../features/cloud-foundry/quota-definition-form/quota-definition-form.component';
import { CFStartAction } from './cf-action.types';

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

const quotaDefinitionEntitySchema = cfEntityFactory(quotaDefinitionEntityType);
const spaceQuotaEntitySchema = cfEntityFactory(spaceQuotaEntityType);

const UNLIMITED = -1;
function orgSpaceQuotaFormValuesToApiObject(formValues: QuotaFormValues, isOrg = true, orgGuid?: string): IQuotaDefinition {
  const res: IQuotaDefinition = {
    name: formValues.name,
    total_services: formValues.totalServices || UNLIMITED,
    total_routes: formValues.totalRoutes || UNLIMITED,
    memory_limit: formValues.memoryLimit,
    app_task_limit: formValues.appTasksLimit || UNLIMITED,
    total_service_keys: formValues.totalServiceKeys || UNLIMITED,
    instance_memory_limit: formValues.instanceMemoryLimit || UNLIMITED,
    non_basic_services_allowed: formValues.nonBasicServicesAllowed,
    total_reserved_route_ports: formValues.totalReservedRoutePorts || UNLIMITED,
    app_instance_limit: formValues.appInstanceLimit || UNLIMITED,
  };
  if (isOrg) {
    // Required for org quotas
    res.total_private_domains = formValues.totalPrivateDomains || UNLIMITED;
  } else if (orgGuid) {
    // Required for creating space quota
    res.organization_guid = orgGuid;
  }
  return res;
}

export class GetQuotaDefinitions extends CFStartAction implements PaginatedAction {
  constructor(
    public paginationKey: string,
    public endpointGuid: string = null,
    public includeRelations: string[] = [],
    public populateMissing = false
  ) {
    super();
    this.options = new HttpRequest(
      'GET',
      'quota_definitions'
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
  constructor(public guid: string, public endpointGuid: string, public includeRelations = [], public populateMissing = true) {
    super();
    this.options = new HttpRequest(
      'GET',
      `quota_definitions/${guid}`
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

export class GetSpaceQuotaDefinition extends CFStartAction implements ICFAction, EntityInlineParentAction {
  constructor(public guid: string, public endpointGuid: string, public includeRelations = [], public populateMissing = true) {
    super();
    this.options = new HttpRequest(
      'GET',
      `space_quota_definitions/${guid}`
    );
  }
  actions = [
    GET_SPACE_QUOTA_DEFINITION,
    GET_SPACE_QUOTA_DEFINITION_SUCCESS,
    GET_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [cfEntityFactory(spaceQuotaEntityType)];
  entityType = spaceQuotaEntityType;
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
      `organizations/${orgGuid}/space_quota_definitions`
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

export class AssociateSpaceQuota extends CFStartAction implements ICFAction {
  public static UpdateExistingSpaceQuota = 'Updating-Existing-Space-Quota';

  constructor(public spaceGuid: string, public endpointGuid: string, spaceQuotaGuid: string) {
    super();
    this.options = new HttpRequest(
      'PUT',
      `space_quota_definitions/${spaceQuotaGuid}/spaces/${spaceGuid}`,
      {}
    );
    this.guid = spaceQuotaGuid;
  }
  actions = [
    ASSOCIATE_SPACE_QUOTA_DEFINITION,
    ASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS,
    ASSOCIATE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [cfEntityFactory(spaceQuotaEntityType)];
  entityType = spaceQuotaEntityType;
  options: HttpRequest<any>;
  updatingKey = AssociateSpaceQuota.UpdateExistingSpaceQuota;
  guid: string;
}

export class DisassociateSpaceQuota extends CFStartAction implements ICFAction {
  public static UpdateExistingSpaceQuota = 'Updating-Existing-Space-Quota';

  constructor(public spaceGuid: string, public endpointGuid: string, spaceQuotaGuid: string) {
    super();
    this.options = new HttpRequest(
      'DELETE',
      `space_quota_definitions/${spaceQuotaGuid}/spaces/${spaceGuid}`
    );
    this.guid = spaceQuotaGuid;
  }
  actions = [
    DISASSOCIATE_SPACE_QUOTA_DEFINITION,
    DISASSOCIATE_SPACE_QUOTA_DEFINITION_SUCCESS,
    DISASSOCIATE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [cfEntityFactory(spaceQuotaEntityType)];
  entityType = spaceQuotaEntityType;
  options: HttpRequest<any>;
  updatingKey = AssociateSpaceQuota.UpdateExistingSpaceQuota;
  guid: string;
}

export class CreateQuotaDefinition extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string, public createQuota: QuotaFormValues) {
    super();
    this.options = new HttpRequest(
      'POST',
      `quota_definitions`,
      orgSpaceQuotaFormValuesToApiObject(createQuota)
    );
  }
  actions = [
    CREATE_QUOTA_DEFINITION,
    CREATE_QUOTA_DEFINITION_SUCCESS,
    CREATE_QUOTA_DEFINITION_FAILED
  ];
  entity = [quotaDefinitionEntitySchema];
  entityType = quotaDefinitionEntityType;
  options: HttpRequest<any>;
}

export class UpdateQuotaDefinition extends CFStartAction implements ICFAction {

  public static UpdateExistingQuota = 'Updating-Existing-Quota';

  constructor(public guid: string, public endpointGuid: string, updateQuota: QuotaFormValues) {
    super();
    this.options = new HttpRequest(
      'PUT',
      `quota_definitions/${guid}`,
      orgSpaceQuotaFormValuesToApiObject(updateQuota)
    );
  }
  actions = [
    UPDATE_QUOTA_DEFINITION,
    UPDATE_QUOTA_DEFINITION_SUCCESS,
    UPDATE_QUOTA_DEFINITION_FAILED
  ];
  entity = [quotaDefinitionEntitySchema];
  entityType = quotaDefinitionEntityType;
  options: HttpRequest<any>;
  updatingKey = UpdateQuotaDefinition.UpdateExistingQuota;
}

export class DeleteQuotaDefinition extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new HttpRequest(
      'DELETE',
      `quota_definitions/${guid}`,
      {
        params: new HttpParams(
          {
            fromObject: {
              recursive: 'true',
              async: 'false'
            }
          }
        )
      }
    );
  }
  actions = [
    DELETE_QUOTA_DEFINITION,
    DELETE_QUOTA_DEFINITION_SUCCESS,
    DELETE_QUOTA_DEFINITION_FAILED
  ];
  entity = [quotaDefinitionEntitySchema];
  entityType = quotaDefinitionEntityType;
  options: HttpRequest<any>;
  removeEntityOnDelete = true;
}

export class CreateSpaceQuotaDefinition extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string, orgGuid: string, public createQuota: QuotaFormValues) {
    super();
    this.options = new HttpRequest(
      'POST',
      `space_quota_definitions`,
      orgSpaceQuotaFormValuesToApiObject(createQuota, false, orgGuid)
    );
  }
  actions = [
    CREATE_SPACE_QUOTA_DEFINITION,
    CREATE_SPACE_QUOTA_DEFINITION_SUCCESS,
    CREATE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [spaceQuotaEntitySchema];
  entityType = spaceQuotaEntityType;
  options: HttpRequest<any>;
}

export class UpdateSpaceQuotaDefinition extends CFStartAction implements ICFAction {

  public static UpdateExistingSpaceQuota = 'Updating-Existing-Space-Quota';

  constructor(public guid: string, public endpointGuid: string, updateQuota: QuotaFormValues) {
    super();
    this.options = new HttpRequest(
      'PUT',
      `space_quota_definitions/${guid}`,
      orgSpaceQuotaFormValuesToApiObject(updateQuota, false)
    );
  }
  actions = [
    UPDATE_SPACE_QUOTA_DEFINITION,
    UPDATE_SPACE_QUOTA_DEFINITION_SUCCESS,
    UPDATE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [spaceQuotaEntitySchema];
  entityType = spaceQuotaEntityType;
  options: HttpRequest<any>;
  updatingKey = UpdateSpaceQuotaDefinition.UpdateExistingSpaceQuota;
}

export class DeleteSpaceQuotaDefinition extends CFStartAction implements ICFAction {
  constructor(public guid: string, public endpointGuid: string) {
    super();
    this.options = new HttpRequest(
      'DELETE',
      `space_quota_definitions/${guid}`,
      {
        params: new HttpParams({
          fromObject: {
            recursive: 'true',
            async: 'false'
          }
        })
      }
    );
  }
  actions = [
    DELETE_SPACE_QUOTA_DEFINITION,
    DELETE_SPACE_QUOTA_DEFINITION_SUCCESS,
    DELETE_SPACE_QUOTA_DEFINITION_FAILED
  ];
  entity = [spaceQuotaEntitySchema];
  entityType = spaceQuotaEntityType;
  options: HttpRequest<any>;
  removeEntityOnDelete = true;
}
