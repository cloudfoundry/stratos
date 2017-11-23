
import { RequestOptions } from '@angular/http';
import { Action, compose, createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';
import { Observable } from 'rxjs/Rx';

import { AppState } from './../app-state';
import { APIResource, APIResourceMetadata, EntityInfo } from '../types/api.types';
import { EntitiesState } from '../types/entity.types';
import { getEntityState, selectEntity, selectRequestInfo } from '../selectors/api.selectors';


export const ApiActionTypes = {
  API_REQUEST: 'API_REQUEST',
  API_REQUEST_START: 'API_REQUEST_START',
  API_REQUEST_SUCCESS: 'API_REQUEST_SUCCESS',
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
};

export const NonApiActionTypes = {
  START: 'NONE_API_REQUEST_START',
  SUCCESS: 'NONE_API_REQUEST_SUCCESS',
  FAILED: 'NONE_API_REQUEST_FAILED',
};




