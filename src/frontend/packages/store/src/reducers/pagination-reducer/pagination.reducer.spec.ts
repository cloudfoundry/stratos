import { HttpRequest } from '@angular/common/http';

import { ENDPOINT_TYPE, endpointEntitySchema, STRATOS_ENDPOINT_TYPE } from '../../../../core/src/base-entity-schemas';
import { RequestTypes } from '../../actions/request.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { EntityCatalogHelpers } from '../../entity-catalog/entity-catalog.helper';
import { EntitySchema } from '../../helpers/entity-schema';
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
  options = new HttpRequest('GET', 'fake123');
  entity = endpointEntitySchema;
  entityType = ENDPOINT_TYPE;
  endpointType = STRATOS_ENDPOINT_TYPE;
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
    expect(paginationReducer({}, { type: 'FAKE_NEWS' })).toEqual({});
    expect(paginationReducer({}, { type: RequestTypes.START })).toEqual({});
  });

  it('should return fetching state', () => {
    const paginationReducer = createPaginationReducer([
      RequestTypes.START,
      RequestTypes.SUCCESS,
      RequestTypes.FAILED
    ]);
    const apiAction = new MockPagAction();
    apiAction.paginationKey = 'PaginationKey';

    const entityKey = entityCatalog.getEntityKey(apiAction);

    const startApiAction = new StartRequestAction(apiAction, 'fetch');
    const newState = paginationReducer(
      {
        [entityKey]: {
          [apiAction.paginationKey]: {
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
      [entityKey]: {
        [apiAction.paginationKey]: {
          pageCount: 0,
          currentPage: 1,
          ids: {},
          pageRequests: {
            1: {
              busy: true,
              error: false,
              message: '',
              maxed: false,
              baseEntityConfig: { entityType: apiAction.entityType, endpointType: apiAction.endpointType, schemaKey: undefined },
              entityConfig: null
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
      paginationKey: apiAction.paginationKey
    });
  });

  it('should return success state', () => {

    const paginationReducer = getReducer();

    const endpointType = 'EndpointType'
    const entityType = 'EntityKey';
    const entityKey = EntityCatalogHelpers.buildEntityKey(entityType, endpointType);
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
        endpointType,
        entityType,
        paginationKey,
        type: 'type',
        entity: {} as EntitySchema,
        options: new HttpRequest('GET', 'fake'),
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

    const endpointType = 'EndpointType'
    const entityType = 'EntityKey';
    const entityKey = EntityCatalogHelpers.buildEntityKey(entityType, endpointType);
    const paginationKey = 'PaginationKey';
    const message = 'Failed';

    const failedApiAction = new WrapperRequestActionFailed(
      message,
      {
        endpointType,
        entityType,
        paginationKey,
        type: 'type',
        entity: {} as EntitySchema,
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
