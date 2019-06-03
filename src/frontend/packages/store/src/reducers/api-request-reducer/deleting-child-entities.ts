import { SetTreeDeleting } from '../../effects/recursive-entity-delete.effect';
import { IFlatTree } from '../../helpers/schema-tree-traverse';
import { BaseRequestDataState } from '../../types/entity.types';
import { RequestInfoState, getDefaultRequestState, DeleteActionState } from './types';

export function setChildEntitiesAsDeleting(state: BaseRequestDataState, action: SetTreeDeleting) {
  const { tree } = action;
  return Object.keys(tree).reduce(reduceTreeToRequestState(tree, { busy: true }), { ...state });
}

export function setChildEntitiesAsDeleted(state: BaseRequestDataState, action: SetTreeDeleting) {
  const { tree } = action;
  return Object.keys(tree).reduce(reduceTreeToRequestState(tree, { busy: false, deleted: true }), { ...state });
}

export function resetChildEntities(state: BaseRequestDataState, action: SetTreeDeleting) {
  const { tree } = action;
  return Object.keys(tree).reduce(reduceTreeToRequestState(tree, { busy: false, deleted: false }), { ...state });
}

function reduceTreeToRequestState(tree: IFlatTree, deleteObject: Partial<DeleteActionState>) {
  return (state: BaseRequestDataState, entityKey: string) => {
    const ids = Array.from(tree[entityKey]);
    return ids.reduce(reduceEntityIdsToRequestState(entityKey, deleteObject), state);
  };
}

function reduceEntityIdsToRequestState(entityKey: string, deleteObject: Partial<DeleteActionState>) {
  return (state: BaseRequestDataState, entityId: string) => {
    return setEntityRequestToObject(
      entityKey,
      entityId,
      state,
      deleteObject
    );
  };
}

function setEntityRequestToObject(
  entityKey: string,
  entityId: string,
  state: BaseRequestDataState,
  deleteObject: Partial<DeleteActionState>
): BaseRequestDataState {
  if (!state[entityKey]) {
    return state;
  }

  const entityRequest = { ...getDefaultRequestState(), ...state[entityKey][entityId] } as RequestInfoState;
  const newEntityRequest = {
    ...entityRequest,
    deleting: {
      ...entityRequest.deleting,
      ...deleteObject
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
