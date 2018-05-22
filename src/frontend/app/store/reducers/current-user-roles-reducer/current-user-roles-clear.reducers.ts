import { DisconnectEndpoint } from '../../actions/endpoint.actions';
import { ICurrentUserRolesState } from '../../types/current-user-roles.types';

export function removeEndpointRoles(state: ICurrentUserRolesState, action: DisconnectEndpoint) {
    const cfState = {
        ...state.cf
    };
    if (action.endpointType !== 'cf' || !cfState[action.guid]) {
        return state;
    }
    delete cfState[action.guid];
    return {
        ...state,
        cf: cfState
    };
}

