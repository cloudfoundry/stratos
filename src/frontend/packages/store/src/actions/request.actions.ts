import { NormalizedResponse } from '../types/api.types';

export const ApiActionTypes = {
  API_REQUEST_START: 'API_REQUEST_START'
};

export const RequestTypes = {
  START: 'REQUEST_START',
  SUCCESS: 'REQUEST_SUCCESS',
  FAILED: 'REQUEST_FAILED',
  UPDATE: 'REQUEST_UPDATE'
};


export class APIResponse {
  response: NormalizedResponse;
  totalResults: number;
  totalPages: number;
}
