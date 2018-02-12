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

export const CF_INFO_ENTITY_KEY = 'cloudFoundryInfo';

export const GET_INFO = '[CF Endpoint] Get Info';
export const CFInfoSchema = new schema.Entity('info');

export class GetEndpointInfo implements IRequestAction {
  constructor(public cfGuid) {}
  type = GET_INFO;
  entityKey = CFInfoSchema.key;
}
