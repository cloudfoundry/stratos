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
