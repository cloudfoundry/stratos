import { CFAction, IAPIAction } from './request.types';
import { Action } from '@ngrx/store';

export class QParam {
  constructor(
    public key: string,
    public value: string | string[],
    public joiner: '>=' | '<=' | '<' | '>' | ' IN ' | ':' | '=' = ':'
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
export interface PaginatedAction extends PaginationAction, IAPIAction {
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
