import { domainEntityType } from '../../../../cloud-foundry/src/cf-entity-factory';
import { IDomain } from '../../../../core/src/core/cf-api.types';
import { APIResource } from '../../types/api.types';
import { EntityRequestAction, ISuccessRequestAction } from '../../types/request.types';
import { requestDataReducerFactory } from './request-data-reducer.factory';

describe('RequestDataReducerFactory', () => {
  it('should create', () => {
    const reducer = requestDataReducerFactory(['a', 'b', 'c', 'd']);
    expect(reducer).toBeDefined();
  });
  it('should create with add new entity', () => {
    const testEntityTypeUnused = 'test-unused';
    const entityKey = domainEntityType;
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
        endpointType: 'cf',
        entityType: entityKey,
        guid,
        actions: ['a', 'b', 'c'],
      } as EntityRequestAction,
      requestType: 'fetch'
    } as ISuccessRequestAction;
    const reducer = requestDataReducerFactory(['a', successType, 'c', 'd']);
    const state = reducer(undefined, action);
    expect(state[entityKey]).toEqual(resEntity);
  });
});

