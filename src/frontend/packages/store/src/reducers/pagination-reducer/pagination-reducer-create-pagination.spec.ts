import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { CreatePagination } from '../../actions/pagination.actions';
import { PaginationState } from '../../types/pagination.types';
import { createNewPaginationSection } from './pagination-reducer-create-pagination';
import { getDefaultPaginationEntityState } from './pagination-reducer-reset-pagination';

describe('CreatePaginationActionReducer', () => {
  const entityType = 'entityType';
  const endpointType = 'endpointType';
  const entityKey = entityCatalog.getEntityKey(endpointType, entityType);

  it('should return exact state', () => {
    const paginationState: PaginationState = {
      [entityKey]: {
        paginationKey: getDefaultPaginationEntityState()
      }
    };
    const action = new CreatePagination(
      {
        entityType,
        endpointType
      },
      'paginationKey'
    );
    const state = createNewPaginationSection(paginationState, action, getDefaultPaginationEntityState());
    expect(paginationState).toEqual(state);
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
      {
        entityType,
        endpointType
      },
      paginationKey
    );
    const state = createNewPaginationSection(paginationState, action, getDefaultPaginationEntityState());
    expect(defaultState).toEqual(state[entityKey][paginationKey]);
  });

  it('should correctly merge ids from seeded state', () => {
    const paginationKey = 'newPaginationKey';
    const ids = {
      7: [
        '1',
        '435',
        '6546456'
      ]
    };
    const pageRequests = {
      8: {
        busy: true,
        error: false,
        message: 'OK'
      }
    };
    const paginationState: PaginationState = {
      [entityKey]: {
        paginationKey: {
          ...getDefaultPaginationEntityState(),
          ids,
          pageRequests
        }
      }
    };
    const action = new CreatePagination(
      {
        entityType,
        endpointType
      },
      paginationKey,
      'paginationKey'
    );
    const state = createNewPaginationSection(paginationState, action, getDefaultPaginationEntityState());
    expect(paginationState[entityKey].paginationKey.ids).toEqual(state[entityKey][paginationKey].ids);
    expect(paginationState[entityKey].paginationKey.pageRequests).toEqual(state[entityKey][paginationKey].pageRequests);
  });

});
