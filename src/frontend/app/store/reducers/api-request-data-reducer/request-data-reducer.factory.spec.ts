import { IDomain } from './../../../core/cf-api.types';
import { domainSchemaKey } from './../../helpers/entity-factory';
import { requestDataReducerFactory } from './request-data-reducer.factory';
import { ISuccessRequestAction, IRequestAction } from '../../types/request.types';
import { applicationSchemaKey, endpointSchemaKey } from '../../helpers/entity-factory';
import { IRequestDataState } from '../../types/entity.types';
import { APIResource } from '../../types/api.types';

describe('RequestDataReducerFactory', () => {
  it('should create', () => {
    const reducer = requestDataReducerFactory([], ['a', 'b', 'c', 'd']);
    expect(reducer).toBeDefined();
  });
  it('should create with default state', () => {
    const id1 = applicationSchemaKey;
    const id2 = endpointSchemaKey;
    const reducer = requestDataReducerFactory([id1, id2], ['a', 'b', 'c', 'd']);
    const state = reducer(undefined, { type: 'UNKNOWN_INIT' });
    expect(state).toEqual({ [id1]: {}, [id2]: {} } as IRequestDataState);
  });
  it('should create with add new entity', () => {
    const testEntityTypeUnused = 'test-unused';
    const entityKey = domainSchemaKey;
    const guid = 'id123';
    const successType = 'SUCCESS_YO';
    const domain = {
      name: guid
    } as IDomain;
    const apiResource = { entity: domain, metadata: {} } as APIResource<IDomain>;
    const resEntity = {
      [guid]: apiResource
    };
    const action = {
      type: successType,
      response: {
        entities: {
          [entityKey]: resEntity
        },
        result: [resEntity[guid].entity.name]
      },
      apiAction: {
        type: 'action-man',
        entityKey,
        guid,
        actions: ['a', 'b', 'c'],
      } as IRequestAction,
      requestType: 'fetch'
    } as ISuccessRequestAction;
    const reducer = requestDataReducerFactory([entityKey, testEntityTypeUnused], ['a', successType, 'c', 'd']);
    const state = reducer(undefined, action);
    expect(state[entityKey]).toEqual(resEntity);
  });
});

