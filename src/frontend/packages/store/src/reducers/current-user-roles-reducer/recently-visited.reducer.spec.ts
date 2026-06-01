import { describe, it, expect } from 'vitest';

import { RemoveRecentEntityAction } from '../../actions/recently-visited.actions';
import { IRecentlyVisitedEntity, IRecentlyVisitedState } from '../../types/recently-visited.types';
import { recentlyVisitedReducer } from './recently-visited.reducer';

const entry = (guid: string, endpointId: string): IRecentlyVisitedEntity => ({
  guid,
  entityId: guid,
  endpointId,
  entityType: 'organization',
  endpointType: 'cf',
  name: guid,
  date: 1,
} as IRecentlyVisitedEntity);

describe('recentlyVisitedReducer — RemoveRecentEntityAction', () => {
  const state: IRecentlyVisitedState = {
    'org-1__cnsi-1': entry('org-1__cnsi-1', 'cnsi-1'),
    'org-2__cnsi-1': entry('org-2__cnsi-1', 'cnsi-1'),
  };

  it('removes the matching recents entry by guid', () => {
    const next = recentlyVisitedReducer(state, new RemoveRecentEntityAction('org-1__cnsi-1'));
    expect(next['org-1__cnsi-1']).toBeUndefined();
    expect(next['org-2__cnsi-1']).toBeDefined();
  });

  it('does not mutate the original state object', () => {
    recentlyVisitedReducer(state, new RemoveRecentEntityAction('org-1__cnsi-1'));
    expect(state['org-1__cnsi-1']).toBeDefined();
  });

  it('returns the same reference when the guid is absent (no-op)', () => {
    const next = recentlyVisitedReducer(state, new RemoveRecentEntityAction('missing'));
    expect(next).toBe(state);
  });
});
