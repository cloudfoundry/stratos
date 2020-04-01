import { Action } from '@ngrx/store';

import { ValidationResult } from '../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { NormalizedResponse } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';
import { ICFAction } from '../types/request.types';

export const ApiActionTypes = {
  API_REQUEST_START: 'API_REQUEST_START'
};

export const RequestTypes = {
  START: 'REQUEST_START',
  SUCCESS: 'REQUEST_SUCCESS',
  FAILED: 'REQUEST_FAILED',
  UPDATE: 'REQUEST_UPDATE'
};

export const EntitiesPipelineActionTypes = {
  VALIDATE: '[Validation] Starting',
  COMPLETE: '[Validation] Completed',
};

export type EntitiesPipelineAction = ICFAction | PaginatedAction;

export class CfValidateEntitiesStart implements Action {
  type = EntitiesPipelineActionTypes.VALIDATE;
  constructor(
    public action: EntitiesPipelineAction,
    public validateEntities: string[],
  ) {
  }
}

export class APIResponse {
  response: NormalizedResponse;
  totalResults: number;
  totalPages: number;
}

export class CfValidateEntitiesComplete implements Action {
  type = EntitiesPipelineActionTypes.COMPLETE;
  constructor(
    public apiAction: EntitiesPipelineAction,
    public apiResponse: APIResponse,
    public validateAction: CfValidateEntitiesStart,
    public validationResult: ValidationResult,
    public independentUpdates: boolean
  ) {

  }
}
