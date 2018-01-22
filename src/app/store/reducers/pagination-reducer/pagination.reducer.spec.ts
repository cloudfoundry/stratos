import { ApplicationSchema } from '../../actions/application.actions';
import { RequestOptions } from '@angular/http';

import {
  RequestTypes,
} from '../../actions/request.actions';
import { createPaginationReducer, defaultPaginationState } from './pagination.reducer';
import { PaginatedAction } from '../../types/pagination.types';
import { StartRequestAction, WrapperRequestActionSuccess, WrapperRequestActionFailed } from '../../types/request.types';

function getReducer() {
  return createPaginationReducer([
    RequestTypes.START,
    RequestTypes.SUCCESS,
    RequestTypes.FAILED
  ]);
}

class MockPagAction implements PaginatedAction {
  actions = ['ONE', 'TWO', 'THREE'];
  options = new RequestOptions();
  entity = ApplicationSchema;
  entityKey = ApplicationSchema.key;
  paginationKey = 'PaginationKey';
  type = RequestTypes.START;
}

function checkState({ newState, expectedNewState, entityKey, paginationKey }) {
  expect(newState[entityKey]).toBeTruthy();
  const state = newState[entityKey][paginationKey];
  const state2 = expectedNewState[entityKey][paginationKey];
  expect(state).toBeTruthy();
  expect(state).toEqual(state2);
}

describe('PaginationReducer', () => {
  const defaultClientPagination = {
    pageSize: 5,
    currentPage: 1,
    filter: {
      string: '',
      items: {}
    }
  };

  it('should return empty state', () => {
    const paginationReducer = getReducer();
    expect(paginationReducer(null, { type: 'FAKE_NEWS' })).toEqual(defaultPaginationState);
    expect(paginationReducer(null, { type: RequestTypes.START })).toEqual(defaultPaginationState);
  });

  it('should return fetching state', () => {
    const paginationReducer = createPaginationReducer([
      RequestTypes.START,
      RequestTypes.SUCCESS,
      RequestTypes.FAILED
    ]);
    const entityKey = ApplicationSchema.key;
    const paginationKey = 'PaginationKey';
    const apiAction = new MockPagAction();
    apiAction.entityKey = entityKey;
    apiAction.paginationKey = paginationKey;

    const startApiAction = new StartRequestAction(apiAction, 'fetch');
    const newState = paginationReducer(
      {
        ...defaultPaginationState,
        [ApplicationSchema.key]: {
          [paginationKey]: {
            fetching: false,
            pageCount: 0,
            currentPage: 1,
            ids: {},
            error: true,
            message: 'aasdasdasd',
            clientPagination: {
              ...defaultClientPagination
            }
          }
        }
      }, startApiAction);
    const expectedNewState = {
      ...defaultPaginationState,
      [ApplicationSchema.key]: {
        [paginationKey]: {
          fetching: true,
          pageCount: 0,
          currentPage: 1,
          ids: {},
          error: false,
          message: '',
          clientPagination: {
            ...defaultClientPagination
          }
        }
      }
    };
    checkState({
      newState,
      expectedNewState,
      entityKey,
      paginationKey
    });
  });

  it('should return success state', () => {

    const paginationReducer = getReducer();

    const entityKey = 'EntityKey';
    const paginationKey = 'PaginationKey';

    const successApiAction = new WrapperRequestActionSuccess(
      {
        entities: {},
        result: [
          1,
          2
        ]
      },
      {
        entityKey,
        paginationKey,
        type: 'type',
        entity: {},
        options: {}
      },
      'fetch'
    );
    const newState = paginationReducer({
      ...defaultPaginationState,
      [entityKey]: {
        [paginationKey]: {
          fetching: true,
          pageCount: 0,
          totalResults: 0,
          currentPage: 1,
          ids: {},
          error: true,
          message: 'asdasdasdasd',
          clientPagination: {
            ...defaultClientPagination
          }
        }
      }
    }, successApiAction);
    const expectedNewState = {
      [entityKey]: {
        [paginationKey]: {
          fetching: false,
          pageCount: 1,
          totalResults: 2,
          currentPage: 1,
          ids: {
            1: [1, 2]
          },
          error: false,
          message: '',
          clientPagination: {
            ...defaultClientPagination
          }
        }
      }
    };
    checkState({
      newState,
      expectedNewState,
      entityKey,
      paginationKey
    });
  });


  it('should return failed state', () => {

    const paginationReducer = getReducer();

    const entityKey = 'EntityKey';
    const paginationKey = 'PaginationKey';
    const message = 'Failed';

    const failedApiAction = new WrapperRequestActionFailed(
      message,
      {
        entityKey,
        paginationKey,
        type: 'type',
        entity: {}
      },
      'fetch'
    );
    const newState = paginationReducer({
      ...defaultPaginationState,
      [entityKey]: {
        [paginationKey]: {
          fetching: true,
          pageCount: 0,
          currentPage: 1,
          totalResults: 0,
          ids: {},
          error: false,
          message: 'asdasdasdasd',
          clientPagination: {
            ...defaultClientPagination
          }
        }
      }
    }, failedApiAction);
    const expectedNewState = {
      [entityKey]: {
        [paginationKey]: {
          fetching: false,
          pageCount: 0,
          currentPage: 1,
          totalResults: 0,
          ids: {},
          error: true,
          message: message,
          clientPagination: {
            ...defaultClientPagination
          }
        }
      }
    };
    checkState({
      newState,
      expectedNewState,
      entityKey,
      paginationKey
    });
  });
});
