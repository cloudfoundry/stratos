import { Action } from '@ngrx/store';

export function applicationReducer(state: {}, action: Action) {
    console.log(action);
    return {...state};
}
