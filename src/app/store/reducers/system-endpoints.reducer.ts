import { CNSISModel } from '../types/cnsis.types';
import { GetSystemSuccess, GET_SYSTEM_INFO_SUCCESS } from './../actions/system.actions';
export function systemEndpointsReducer(state: {
    [guid: string]: CNSISModel
}, action: GetSystemSuccess) {
    if (action.type === GET_SYSTEM_INFO_SUCCESS) {
        const newState = { ...state };

        Object.keys(action.payload.endpoints.cf).forEach(guid => {
            newState[guid] = {
                ...newState[guid],
                info: action.payload.endpoints.cf[guid]
            };
        });
        return { ...state, ...action.payload.endpoints.cf };
    }
    return state;
}
