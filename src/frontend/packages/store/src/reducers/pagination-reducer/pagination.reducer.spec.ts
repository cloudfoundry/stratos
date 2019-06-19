import { RequestOptions } from '@angular/http';

import { applicationEntityType, cfEntityFactory, CFEntitySchema } from '../../../../cloud-foundry/src/cf-entity-factory';
import { RequestTypes } from '../../actions/request.actions';
import { PaginatedAction } from '../../types/pagination.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../../types/request.types';
import { createPaginationReducer } from './pagination.reducer';

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
  entity = cfEntityFactory(applicationEntityType);
  entityType = applicationEntityType;
  endpointType: 'endpoint';
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
    totalResult: 0,
    filter: {
      string: '',
      items: {}
    }
  };

  it('should return empty state', () => {
    const paginationReducer = getReducer();
    expect(paginationReducer(null, { type: 'FAKE_NEWS' })).toEqual({});
    expect(paginationReducer(null, { type: RequestTypes.START })).toEqual({});
  });

  it('should return fetching state', () => {
    const paginationReducer = createPaginationReducer([
      RequestTypes.START,
      RequestTypes.SUCCESS,
      RequestTypes.FAILED
    ]);
    const entityKey = applicationEntityType;
    const paginationKey = 'PaginationKey';
    const apiAction = new MockPagAction();
    apiAction.entityType = entityKey;
    apiAction.paginationKey = paginationKey;

    const startApiAction = new StartRequestAction(apiAction, 'fetch');
    const newState = paginationReducer(
      {
        [applicationEntityType]: {
          [paginationKey]: {
            pageCount: 0,
            currentPage: 1,
            ids: {},
            pageRequests: {},
            clientPagination: {
              ...defaultClientPagination
            }
          }
        }
      }, startApiAction);
    const expectedNewState = {
      [applicationEntityType]: {
        [paginationKey]: {
          pageCount: 0,
          currentPage: 1,
          ids: {},
          pageRequests: {
            1: {
              busy: true, error: false, message: '',
              schemaKey: undefined,
              entityKey: applicationEntityType,
              maxed: false
            }
          },
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
          '1',
          '2'
        ]
      },
      {
        endpointType: 'cf',
        entityType: entityKey,
        paginationKey,
        type: 'type',
        entity: {} as CFEntitySchema,
        options: {},
        actions: []
      },
      'fetch',
      2,
      1,
    );
    const newState = paginationReducer({
      [entityKey]: {
        [paginationKey]: {
          pageCount: 0,
          totalResults: 0,
          currentPage: 1,
          ids: {},
          pageRequests: {},
          clientPagination: {
            ...defaultClientPagination
          }
        }
      }
    }, successApiAction);
    const expectedNewState = {
      [entityKey]: {
        [paginationKey]: {
          pageCount: 1,
          totalResults: 2,
          currentPage: 1,
          ids: {
            1: ['1', '2']
          },
          pageRequests: { 1: { busy: false, error: false, message: '' } },
          clientPagination: {
            ...defaultClientPagination,
            totalResults: 2
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
        endpointType: 'cf',
        entityType: entityKey,
        paginationKey,
        type: 'type',
        entity: {} as CFEntitySchema,
        actions: []
      },
      'fetch'
    );
    const newState = paginationReducer({
      [entityKey]: {
        [paginationKey]: {
          pageCount: 0,
          currentPage: 1,
          totalResults: 0,
          ids: {},
          pageRequests: {},
          clientPagination: {
            ...defaultClientPagination
          }
        }
      }
    }, failedApiAction);
    const expectedNewState = {
      [entityKey]: {
        [paginationKey]: {
          pageCount: 0,
          currentPage: 1,
          totalResults: 0,
          ids: {},
          pageRequests: { 1: { busy: false, error: true, message } },
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
