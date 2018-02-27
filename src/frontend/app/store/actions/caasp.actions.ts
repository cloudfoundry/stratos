import {
  RequestAction,
  IRequestAction,
  CFStartAction,
  ICFAction
} from '../types/request.types';
import { RequestOptions } from '@angular/http';
import { Schema, schema } from 'normalizr';
import { Action, createSelector } from '@ngrx/store';

import { AppState } from '../app-state';
import { PaginatedAction } from '../types/pagination.types';

export const CAASP_INFO_ENTITY_KEY = 'caaspInfo';

export const GET_INFO = '[CAASP Endpoint] Get Info';
export const CaaspInfoSchema = new schema.Entity(CAASP_INFO_ENTITY_KEY);

export class GetCaaspInfo implements IRequestAction {
  constructor(public caaspGuid) {}
  type = GET_INFO;
  entityKey = CaaspInfoSchema.key;
}
