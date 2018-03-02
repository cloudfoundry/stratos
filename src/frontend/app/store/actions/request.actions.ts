import { Action } from '@ngrx/store';

import { tempAppStore } from '../helpers/entity-relations.helpers';
import { NormalizedResponse } from '../types/api.types';
import { PaginatedAction } from '../types/pagination.types';
import { ICFAction } from '../types/request.types';

export const ApiActionTypes = {
  API_REQUEST_START: 'API_REQUEST_START'
};

export const RequestTypes = {
  START: 'REQUEST_START',
  SUCCESS: 'REQUEST_SUCCESS',
  FAILED: 'REQUEST_FAILED'
};

export const EntitiesPipelineActionTypes = {
  FETCH: '[Entities Pipeline] Fetch',
  VALIDATE: '[Entities Pipeline] Validating',
  COMPLETE: '[Entities Pipeline] Completed',
};

export type EntitiesPipelineAction = ICFAction | PaginatedAction;

// TODO: RC Delete
export class FetchEntities implements Action {
  type = EntitiesPipelineActionTypes.FETCH;
  constructor(
    public action: EntitiesPipelineAction,
    public haveStarted: boolean,
    public config: {
      guids: () => any[],
      shouldFetch: () => boolean
    },
  ) {

  }
}

export class ValidateEntitiesStart implements Action {
  type = EntitiesPipelineActionTypes.VALIDATE;
  constructor(
    public action: EntitiesPipelineAction,
    public validateEntities: string[],
    public haveStarted: boolean,
    public apiResponse?: APIResponse, // For http check we have a new set of entities, otherwise null look at current set of entities
  ) {
  }
}

export class APIResponse {
  response: NormalizedResponse;
  totalResults: number;
  totalPages: number;
}

export class EntitiesPipelineCompleted implements Action {
  type = EntitiesPipelineActionTypes.COMPLETE;
  constructor(
    public action: EntitiesPipelineAction,
    public apiResponse: APIResponse
  ) {

  }
}
