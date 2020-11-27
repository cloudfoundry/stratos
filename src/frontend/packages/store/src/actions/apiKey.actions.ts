import { apiKeyEntityType, STRATOS_ENDPOINT_TYPE, stratosEntityFactory } from '../helpers/stratos-entity-factory';
import { PaginatedAction, PaginationParam } from '../types/pagination.types';
import { EntityRequestAction } from '../types/request.types';

export const API_KEY_ADD = '[API Key] Add API Key';
export const API_KEY_DELETE = '[API Key] Delete API Key';
export const API_KEY_GET_ALL = '[API Key] Get All API Key';

abstract class BaseApiKeyAction implements EntityRequestAction {
  entityType = apiKeyEntityType;
  endpointType = STRATOS_ENDPOINT_TYPE;
  entity = [stratosEntityFactory(apiKeyEntityType)];
  constructor(public type: string) { }
}

interface PaginationApiKeyAction extends PaginatedAction, EntityRequestAction {
  flattenPagination: boolean;
}
interface SingleApiKeyAction extends EntityRequestAction {
  guid: string;
}

export class AddApiKey extends BaseApiKeyAction implements SingleApiKeyAction {
  constructor(public comment: string) {
    super(API_KEY_ADD);
  }
  guid = 'ADD';
}

export class DeleteApiKey extends BaseApiKeyAction implements SingleApiKeyAction {
  constructor(public guid: string) {
    super(API_KEY_DELETE);
  }
}

export class GetAllApiKeys extends BaseApiKeyAction implements PaginationApiKeyAction {
  constructor() {
    super(API_KEY_GET_ALL);
    this.paginationKey = 'CURRENT_USERS';
  }
  flattenPagination = true;
  paginationKey: string;
  initialParams: PaginationParam;
}
