import { SetTreeDeleting } from '../../effects/recusive-entity-delete.effect';
import { IFlatTree } from '../../helpers/schema-tree-traverse';
import { IRequestDataState } from '../../types/entity.types';
import { RequestInfoState } from './types';

export function setChildEntitiesAsDeleted(state: IRequestDataState, action: SetTreeDeleting) {
  const { tree } = action;
  return Object.keys(tree).reduce(reduceTreeToRequestState(tree), { ...state });
}

function reduceTreeToRequestState(tree: IFlatTree) {
  return (state: IRequestDataState, entityKey: string) => {
    const ids = Array.from(tree[entityKey]);
    return ids.reduce(reduceEntityIdsToRequestState(entityKey), state);
  };
}

function reduceEntityIdsToRequestState(entityKey: string) {
  return (state: IRequestDataState, entityId: string) => {
    return setEntityRequestToDeleting(
      entityKey,
      entityId,
      state
    );
  };
}

function setEntityRequestToDeleting(entityKey: string, entityId: string, state: IRequestDataState): IRequestDataState {
  if (!state[entityKey] || !state[entityKey][entityId]) {
    return state;
  }
  const entityRequest = { ...state[entityKey][entityId] } as RequestInfoState;
  const newEntityRequest = {
    ...entityRequest,
    deleting: {
      ...entityRequest.deleting,
      busy: true
    }
  };
  return {
    ...state,
    [entityKey]: {
      ...state[entityKey],
      [entityId]: newEntityRequest
    }
  };
}
