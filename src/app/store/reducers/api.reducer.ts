import { EntitiesState } from './api.reducer';
import { ApiActionTypes } from './../actions/api.actions';
import { Action } from '@ngrx/store';

export interface EntitiesState {
    application: {};
}

const defaultState = {
     application: {}
};

const mergeState = (state, newState) => {
    const baseState = { ...state };

    Object.keys(newState).forEach(entityKey => {
        newState[entityKey] = {
            ...newState[entityKey],
            ...newState[entityKey]
        };
    });

    return newState;
};

export function entitiesReducer(state: EntitiesState = defaultState, action) {
    switch (action.apiType) {
        case ApiActionTypes.API_REQUEST_SUCCESS:
            return mergeState(state, action.response.entities);
        default:
            return state;
    }
}

