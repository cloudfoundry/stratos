import { Action } from '@ngrx/store';

import {
  APIResponse,
  EntitiesPipelineAction,
  EntitiesPipelineActionTypes,
} from '../../../store/src/actions/request.actions';
import { ValidationResult } from '../entity-relations/entity-relations.types';

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