import {
    APIAction,
    ApiActionTypes,
    StartAPIAction,
    WrapperAPIActionFailed,
    WrapperAPIActionSuccess,
} from './../actions/api.actions';
import { paginationReducer } from './pagination.reducer';

function checkState({ newState, expectedNewState, entityKey, paginationKey }) {
    expect(newState[entityKey]).toBeTruthy();
    expect(newState[entityKey][paginationKey]).toBeTruthy();
    expect(newState[entityKey][paginationKey]).toEqual(expectedNewState);
}

describe('PaginationReducer', () => {

  it('should return empty state', () => {
    expect(paginationReducer({}, { type: 'FAKE_NEWS' })).toEqual({});
    expect(paginationReducer({}, { type: ApiActionTypes.API_REQUEST })).toEqual({});
  });

  it('should return fetching state', () => {
    const entityKey = 'EntityKey';
    const paginationKey = 'PaginationKey';
    const apiAction = new APIAction();
    apiAction.entityKey = entityKey;
    apiAction.paginationKey = paginationKey;

    const startApiAction = new StartAPIAction(apiAction);
    const newState = paginationReducer( {
        fetching: false,
        pageCount: 0,
        currentPage: 1,
        ids: {},
        error: true,
        message: 'asdasdasdasasdd'
    }, startApiAction);
    const expectedNewState = {
        fetching: true,
        pageCount: 0,
        currentPage: 1,
        ids: {},
        error: false,
        message: ''
    };
    checkState({
        newState,
        expectedNewState,
        entityKey,
        paginationKey
    });
  });

  it('should return success state', () => {
    const entityKey = 'EntityKey';
    const paginationKey = 'PaginationKey';

    const successApiAction = new WrapperAPIActionSuccess(
        '[News] Get all',
        {
            result: [
                1,
                2
            ]
        },
        entityKey,
        paginationKey
    );
    const newState = paginationReducer({
        [entityKey]: {
            [paginationKey]: {
                fetching: true,
                pageCount: 0,
                currentPage: 1,
                ids: {},
                error: true,
                message: 'asdasdasdasd'
            }
        }
    }, successApiAction);
    const expectedNewState = {
        fetching: false,
        pageCount: 1,
        currentPage: 1,
        ids: {
            1: [1, 2]
        },
        error: false,
        message: ''
    };
    checkState({
        newState,
        expectedNewState,
        entityKey,
        paginationKey
    });
  });


  it('should return failed state', () => {
    const entityKey = 'EntityKey';
    const paginationKey = 'PaginationKey';
    const message = 'Failed';

    const failedApiAction = new WrapperAPIActionFailed(
        '[News] Get all Failed',
        message,
        entityKey,
        paginationKey
    );
    const newState = paginationReducer({
        [entityKey]: {
            [paginationKey]: {
                fetching: true,
                pageCount: 0,
                currentPage: 1,
                ids: {},
                error: false,
                message: 'asdasdasdasd'
            }
        }
    }, failedApiAction);
    const expectedNewState = {
        fetching: false,
        pageCount: 0,
        currentPage: 1,
        ids: {},
        error: true,
        message: message
    };
    checkState({
        newState,
        expectedNewState,
        entityKey,
        paginationKey
    });
  });
});
