import { Action } from '@ngrx/store';
import { APIAction } from './api.types';

export class QParam {
  constructor(
    public key: string,
    public value: string | string[],
    public joiner: '>=' | '<=' | '<' | '>' | '%2BIN%2B' | ':' | '=' = ':'
  ) { }
}

export interface PaginationParam {
  q?: QParam[];
  [entityKey: string]: any;
}

export class PaginationEntityState {
  currentPage = 0;
  totalResults = 0;
  pageCount = 0;
  ids = {};
  params: PaginationParam;
  fetching: boolean;
  error: boolean;
  message: string;
}

// An action that is intended to begin a
export interface PaginatedAction extends PaginationAction, APIAction {
  initialParams?: PaginationParam;
}
export interface PaginationAction extends Action {
  entityKey: string;
  paginationKey: string;
}

export interface PaginationEntityTypeState {
  [paginationKey: string]: PaginationEntityState;
}

export interface PaginationState {
  [entityKey: string]: PaginationEntityTypeState;
}
