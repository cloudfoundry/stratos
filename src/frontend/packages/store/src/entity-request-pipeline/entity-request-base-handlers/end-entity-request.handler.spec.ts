import { endEntityHandler } from './end-entity-request.handler';
import { EntityRequestAction, WrapperRequestActionSuccess } from '../../types/request.types';

describe('end-entity-request', () => {
  it(' should dispatch end action', (done) => {
    const testAction = { type: 'test' } as EntityRequestAction;
    const requestType = 'fetch';
    const normedResults = {
      entities: {},
      result: []
    };
    endEntityHandler(
      (action: WrapperRequestActionSuccess) => {
        expect(action instanceof WrapperRequestActionSuccess).toBe(true);
        expect(action.apiAction).toBe(testAction);
        expect(action.requestType).toBe(requestType);
        expect(action.response).toBe(normedResults);
        done();
      },
      requestType,
      testAction,
      normedResults
    );
  });
});
