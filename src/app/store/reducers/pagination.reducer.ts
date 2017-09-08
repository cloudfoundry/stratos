import { APIAction } from './../actions/api.actions';
import { ApiActionTypes } from '../actions/api.actions';

class PaginationEntityState {
    currentPage = 0;
    pageCount = 0;
    pages = [];
    loading: false;
    error: false;
    message: '';
}

const paginate = ({ types, mapActionToKey }) => {
  if (!Array.isArray(types) || types.length !== 3) {
    throw new Error('Expected types to be an array of three elements.');
  }
  if (!types.every(t => typeof t === 'string')) {
    throw new Error('Expected types to be strings.');
  }
  if (typeof mapActionToKey !== 'function') {
    throw new Error('Expected mapActionToKey to be a function.');
  }

  const [ requestType, successType, failureType ] = types;

  const updatePagination = (state = {
    isFetching: false,
    nextPageUrl: undefined,
    pageCount: 0,
    ids: []
  }, action) => {
    switch (action.type) {
      case requestType:
        return {
          ...state,
          isFetching: true
        };
      case successType:
        return {
          ...state,
          isFetching: false,
          ids: [...state.ids, ...action.response.result],
          nextPageUrl: action.response.nextPageUrl,
          pageCount: state.pageCount + 1
        };
      case failureType:
        return {
          ...state,
          isFetching: false
        };
      default:
        return state;
    }
  };

  return (state = {}, action: APIAction) => {
    // Update pagination by key
    switch (action.type) {
      case requestType:
      case successType:
      case failureType:
        const key = mapActionToKey(action);
        if (typeof key !== 'string') {
          throw new Error('Expected key to be a string.');
        }
        return {
          ...state,
          [key]: updatePagination(state[key], action)
        };
      default:
        return state;
    }
  };
};

export default paginate({
    types: [
        ApiActionTypes.API_REQUEST_START,
        ApiActionTypes.API_REQUEST_SUCCESS,
        ApiActionTypes.API_REQUEST_FAILED
    ],
    mapActionToKey: (action: APIAction) => action.entity.key
});
