import { EntitiesState } from './api.reducer';
import { ApiActionTypes } from './../actions/api.actions';
import { Action } from '@ngrx/store';

export interface EntitiesState {
    application: {};
}

const defaultState = {
     application: {}
};

export function entitiesReducer(state: EntitiesState = defaultState, action) {
    switch (action.apiType) {
        case ApiActionTypes.API_REQUEST_SUCCESS:
            return { ...state, ...action.response.entities };
        default:
            return state;
    }
}

