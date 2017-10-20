export const mergeState = (state, newState) => {
  const baseState = { ...state };

  Object.keys(newState).forEach(entityKey => {
    baseState[entityKey] = {
      ...baseState[entityKey],
      ...newState[entityKey]
    };
  });

  return baseState;
};

export const pick = <O, K extends keyof O>(o: O, keys: [K]): Pick<O, K> => {
  const copy: any = {};
  keys.forEach(k => {
    copy[k] = o[k];
  });
  return copy;
};
