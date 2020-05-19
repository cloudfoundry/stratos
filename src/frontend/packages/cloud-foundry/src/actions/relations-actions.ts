import { Action } from '@ngrx/store';

import { APIResponse } from '../../../store/src/actions/request.actions';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ICFAction } from '../../../store/src/types/request.types';
import { ValidationResult } from '../entity-relations/entity-relations.types';

type EntitiesPipelineAction = ICFAction | PaginatedAction;

export const EntitiesPipelineActionTypes = {
  VALIDATE: '[Validation] Starting',
  COMPLETE: '[Validation] Completed',
};

export class CfValidateEntitiesStart implements Action {
  type = EntitiesPipelineActionTypes.VALIDATE;
  constructor(
    public action: EntitiesPipelineAction,
    public validateEntities: string[],
  ) {
  }
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