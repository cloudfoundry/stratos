import { GET_CNSIS, GET_CNSIS_FAILED, GET_CNSIS_SUCCESS } from './../actions/cnsis.actions';


export interface CNSISModel {
    api_endpoint: {
        ForceQuery: boolean,
        Fragment: string,
        Host: string,
        Opaque: string,
        Path: string,
        RawPath: string,
        RawQuery: string,
        Scheme: string,
        User: object
    };
    authorization_endpoint: string;
    cnsi_type: string;
    doppler_logging_endpoint: string;
    guid: string;
    name: string;
    skip_ssl_validation: boolean;
    token_endpoint: string;
    // This is generated client side when we login
    registered?: boolean;
}

export interface CNSISState {
    entities: CNSISModel[];
    loading: boolean;
    error: boolean;
    message: string;
}

export function cnsisReducer(state: CNSISState = {
    entities: [],
    loading: false,
    error: false,
    message: ''
}, action): CNSISState {
    switch (action.type) {
        case GET_CNSIS:
            return { ...state, loading: true, message: '', error: false };
        case GET_CNSIS_SUCCESS:
            return { ...state, loading: false, message: '', error: false, entities: action.payload };
        case GET_CNSIS_FAILED:
            return { ...state, loading: false, message: action.message || 'Failed to get cnsis', error: true };
        default:
            return state;
    }
}
