import { AppState } from '../app-state';
import { Action, compose } from '@ngrx/store';
import {
  PaginationAction,
  PaginationEntityState,
  PaginationEntityTypeState,
  PaginationParam,
  PaginationState,
} from '../types/pagination.types';



export const CLEAR_PAGINATION_OF_TYPE = '[Pagination] Clear all pages of type';
export const CLEAR_PAGES = '[Pagination] Clear pages';
export const SET_PAGE = '[Pagination] Set Page';
export const SET_PARAMS = '[Pagination] Set Params';
export const ADD_PARAMS = '[Pagination] Add Params';
export const REMOVE_PARAMS = '[Pagination] Remove Params';

export class ClearPaginationOfType implements Action {
  constructor(public entityKey: string) {
  }
  type = CLEAR_PAGINATION_OF_TYPE;
}

export class ClearPagination implements PaginationAction {
  constructor(public entityKey: string, public paginationKey: string) {
  }
  type = CLEAR_PAGES;
}

export class SetPage implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public pageNumber: number
  ) {
  }
  type = SET_PAGE;
}

export class SetParams implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public params: PaginationParam
  ) {
  }
  type = SET_PARAMS;
}

export class AddParams implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public params: PaginationParam,
    public keepPages = false
  ) {
  }
  type = ADD_PARAMS;
}

export class RemoveParams implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public params: string[],
    public qs: string[]
  ) {
  }
  type = REMOVE_PARAMS;
}
