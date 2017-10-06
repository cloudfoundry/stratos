import { ApiActionTypes } from './../actions/api.actions';
import { mergeState } from './../helpers/reducer.helper';

export interface EntitiesState {
    application: any;
    applicationSummary: any;
    stack: any;
    space: any;
    organization: any;
    route: any;
}

export const defaultEntitiesState = {
    application: {},
    applicationSummary: {},
    stack: {},
    space: {},
    organization: {},
    route: {}
};

export function entitiesReducer(state: EntitiesState = defaultEntitiesState, action) {
    switch (action.apiType) {
        case ApiActionTypes.API_REQUEST_SUCCESS:
            return mergeState(state, action.response.entities);
        default:
            return state;
    }
}

