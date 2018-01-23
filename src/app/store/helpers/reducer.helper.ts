export const mergeState = (state, newState) => {
  const baseState = { ...state };

  Object.keys(newState).forEach(entityKey => {
    if (shouldMerge(newState, baseState, entityKey)) {
      baseState[entityKey] = newState[entityKey];
    } else {
      baseState[entityKey] = {
        ...baseState[entityKey],
        ...newState[entityKey]
      };
    }
  });

  return baseState;
};

export const deepMergeState = (state, newState) => {
  const baseState = { ...state };
  Object.keys(newState).forEach(entityKey => {
    if (shouldMerge(newState, baseState, entityKey)) {
      const baseStateEnt = { ...baseState[entityKey] };
      const newStateEnt = newState[entityKey];
      Object.keys(newStateEnt).forEach(id => {
        baseStateEnt[id] = {
          ...baseStateEnt[id],
          ...newStateEnt[id]
        };
      });
      baseState[entityKey] = {
        ...baseState[entityKey],
        ...baseStateEnt
      };
    } else {
      baseState[entityKey] = newState[entityKey];
    }
  });
  return baseState;
};

function shouldMerge(newState, baseState, entityKey) {
  return typeof newState[entityKey] !== 'string' && baseState[entityKey] && Object.keys(baseState[entityKey]);
}

export const pick = <O, K extends keyof O>(o: O, keys: [K]): Pick<O, K> => {
  const copy: any = {};
  keys.forEach(k => {
    copy[k] = o[k];
  });
  return copy;
};

export const composeFn = (...fns) =>
  fns.reverse().reduce((prevFn, nextFn) =>
    value => nextFn(prevFn(value)),
    value => value
  );
