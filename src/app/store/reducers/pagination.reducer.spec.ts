import { ApplicationSchema } from '../actions/application.actions';
import { RequestOptions } from '@angular/http';

import {
  APIAction,
  ApiActionTypes,
  StartAPIAction,
  WrapperAPIActionFailed,
  WrapperAPIActionSuccess,
} from './../actions/api.actions';
import { PaginatedAction, paginationReducer, PaginationAction } from './pagination.reducer';
import { defaultEntitiesState } from './entity.reducer';


class MockPagAction implements PaginatedAction {
  actions = ['ONE', 'TWO', 'THREE'];
  options = new RequestOptions();
  entity = ApplicationSchema;
  entityKey = ApplicationSchema.key;
  paginationKey = 'PaginationKey';
  type = ApiActionTypes.API_REQUEST;
}

function checkState({ newState, expectedNewState, entityKey, paginationKey }) {
  expect(newState[entityKey]).toBeTruthy();
  expect(newState[entityKey][paginationKey]).toBeTruthy();
  expect(newState[entityKey][paginationKey]).toEqual(expectedNewState);
}

describe('PaginationReducer', () => {

  it('should return empty state', () => {
    expect(paginationReducer(null, { type: 'FAKE_NEWS' })).toEqual({ ...defaultEntitiesState });
    expect(paginationReducer(null, { type: ApiActionTypes.API_REQUEST })).toEqual({});
  });

  it('should return fetching state', () => {
    const entityKey = 'EntityKey';
    const paginationKey = 'PaginationKey';
    const apiAction = new MockPagAction();
    apiAction.entityKey = entityKey;
    apiAction.paginationKey = paginationKey;

    const startApiAction = new StartAPIAction(apiAction);
    const newState = paginationReducer(
      {
        ...defaultEntitiesState,
        [ApplicationSchema.key]: {
          fetching: false,
          pageCount: 0,
          currentPage: 1,
          ids: {},
          error: true,
          message: 'asdasdasdasasdd'
        }
      }, startApiAction);
    const expectedNewState = {
      ...defaultEntitiesState,
      [ApplicationSchema.key]: {
        fetching: true,
        pageCount: 0,
        currentPage: 1,
        ids: {},
        error: false,
        message: ''
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
    const entityKey = 'EntityKey';
    const paginationKey = 'PaginationKey';

    const successApiAction = new WrapperAPIActionSuccess(
      '[News] Get all',
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
        actions: [],
        type: 'type',
        options: new RequestOptions,
        entity: {}
      }
    );
    const newState = paginationReducer({
      ...defaultEntitiesState,
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
      {
        entityKey,
        paginationKey,
        actions: [],
        type: 'type',
        options: new RequestOptions,
        entity: {}
      }
    );
    const newState = paginationReducer({
      ...defaultEntitiesState,
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
