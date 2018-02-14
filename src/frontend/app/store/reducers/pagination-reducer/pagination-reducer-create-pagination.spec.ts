import { CreatePagination } from '../../actions/pagination.actions';
import { createNewPaginationSection } from './pagination-reducer-create-pagination';
import { getDefaultPaginationEntityState } from './pagination.reducer';

fdescribe('CreatePaginationActionReducer', () => {
  const entityKey = 'entityKey';
  it('should return exact state', () => {
    const paginationState = {
      [entityKey]: {
        paginationKey: getDefaultPaginationEntityState()
      }
    };
    const action = new CreatePagination(
      entityKey,
      'paginationKey'
    );
    const state = createNewPaginationSection(paginationState, action, getDefaultPaginationEntityState());
    expect(paginationState).toBe(state);
  });

  it('should return newly created state', () => {
    const paginationKey = 'newPaginationKey';
    const defaultState = getDefaultPaginationEntityState();
    const paginationState = {
      [entityKey]: {
        paginationKey: getDefaultPaginationEntityState()
      }
    };
    const action = new CreatePagination(
      entityKey,
      paginationKey
    );
    const state = createNewPaginationSection(paginationState, action, getDefaultPaginationEntityState());
    expect(defaultState).toEqual(state[entityKey][paginationKey]);
  });

  it('should correctly merge ids from seeded state', () => {
    const paginationKey = 'newPaginationKey';
    const ids = {
      7: [
        1,
        435,
        6546456
      ]
    };
    const pageRequests = {
      8: {
        busy: true,
        error: false,
        message: 'OK'
      }
    };
    const paginationState = {
      [entityKey]: {
        paginationKey: {
          ...getDefaultPaginationEntityState(),
          ids,
          pageRequests
        }
      }
    };
    const action = new CreatePagination(
      entityKey,
      'newPaginationKey'
    );
    const state = createNewPaginationSection(paginationState, action, getDefaultPaginationEntityState());
    console.log(state[entityKey][paginationKey].ids);
    console.log(paginationState[entityKey]['paginationKey'].ids);
    expect(paginationState[entityKey]['paginationKey'].ids).toEqual(state[entityKey][paginationKey].ids);
    expect(paginationState[entityKey]['paginationKey'].pageRequests).toEqual(state[entityKey][paginationKey].pageRequests);
  });

});
