import { EntityRequestPipelineFactory } from '../entity-request-pipeline.types';
import { AppState } from '../../src/app-state';
import { EntityRequestAction, StartRequestAction, WrapperRequestActionSuccess } from '../../src/types/request.types';

// const startEntityPipe = (state, action) => state;

export const endEntityPipeFactory: EntityRequestPipelineFactory<AppState, EntityRequestAction> = (
  store,
  catalogueEntity,
  requestType
) => {
  return (state, action) => {
    const entityAction = catalogueEntity.getRequestAction('start', requestType);
    store.dispatch(new WrapperRequestActionSuccess(action, requestType));
    store.dispatch(entityAction);
    return state;
  };
};
