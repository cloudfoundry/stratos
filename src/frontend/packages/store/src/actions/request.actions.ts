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

// TODO: RC TWEAK/MOVE ICFACTION
export type EntitiesPipelineAction = ICFAction | PaginatedAction;

// TODO: RC TWEAK/MOVE
export class APIResponse {
  response: NormalizedResponse;
  totalResults: number;
  totalPages: number;
}


