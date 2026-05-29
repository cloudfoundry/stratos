import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { CfUserListDiagnosticsService } from './cf-user-list-diagnostics.service';
import { CfUsersPagedDataService } from '../../shared/data-services/cf-users-paged-data.service';
import { StUser } from '../endpoint-data/stratos-types';

// Signal-native stub of CfUsersPagedDataService keyed by cnsi (== cfGuid).
function makeUsersDataStub(state: {
  users?: StUser[];
  count?: number;
  loading?: boolean;
  lastFetched?: Date | null;
  error?: unknown;
}) {
  const users = signal<StUser[]>(state.users ?? []);
  const count = signal(state.count ?? 0);
  const loading = signal(state.loading ?? false);
  const lastFetched = signal<Date | null>(state.lastFetched ?? null);
  return {
    usersSignal: (_cnsi: string) => users.asReadonly(),
    count: (_cnsi: string) => count.asReadonly(),
    isLoading: (_cnsi: string) => loading.asReadonly(),
    lastFetched: (_cnsi: string) => lastFetched.asReadonly(),
    errorsByCnsi: signal((_cnsi: string) => state.error).asReadonly(),
  };
}

function configure(stub: ReturnType<typeof makeUsersDataStub>): CfUserListDiagnosticsService {
  TestBed.configureTestingModule({
    providers: [
      CfUserListDiagnosticsService,
      { provide: CfUsersPagedDataService, useValue: stub },
    ],
  });
  return TestBed.inject(CfUserListDiagnosticsService);
}

const mkUser = (guid: string): StUser => ({ guid } as StUser);

describe('CfUserListDiagnosticsService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('returns an error shape for an unknown cfGuid', () => {
    const svc = configure(makeUsersDataStub({}));
    const out = svc.probe('missing') as { error: string; knownKeys: string[] };
    expect(out.error).toContain('missing');
    expect(out.knownKeys).toEqual([]);
  });

  it('sources the snapshot from CfUsersPagedDataService signals', () => {
    const fetchedAt = new Date('2026-05-29T00:00:00Z');
    const svc = configure(
      makeUsersDataStub({
        users: [mkUser('u1'), mkUser('u2'), mkUser('u3')],
        count: 42,
        loading: true,
        lastFetched: fetchedAt,
        error: 'boom',
      }),
    );
    svc.ensure('cf1');

    const out = svc.probe('cf1') as { usersDataSnapshot: Record<string, unknown> };
    expect(out.usersDataSnapshot).toEqual({
      loadedCount: 3,
      loadedGuids: ['u1', 'u2', 'u3'],
      totalResults: 42,
      fetching: true,
      lastFetched: fetchedAt,
      error: 'boom',
    });
  });

  it('caps loadedGuids preview at five entries', () => {
    const svc = configure(
      makeUsersDataStub({ users: Array.from({ length: 8 }, (_, i) => mkUser(`u${i}`)) }),
    );
    svc.ensure('cf1');

    const out = svc.probe('cf1') as { usersDataSnapshot: { loadedGuids: string[] } };
    expect(out.usersDataSnapshot.loadedGuids).toEqual(['u0', 'u1', 'u2', 'u3', 'u4']);
  });

  it('still echoes recorded identity and events alongside the snapshot', () => {
    const svc = configure(makeUsersDataStub({ count: 1, users: [mkUser('a')] }));
    svc.setIdentity('cf1', '/pp/v1/cf/users', 'signal:cf1', 'CfUsersSignalConfigService');
    svc.record('cf1', 'view-pipeline-built');

    const out = svc.probe('cf1') as {
      entityKey: string;
      paginationKey: string;
      actionType: string;
      eventsLen: number;
    };
    expect(out.entityKey).toBe('/pp/v1/cf/users');
    expect(out.paginationKey).toBe('signal:cf1');
    expect(out.actionType).toBe('CfUsersSignalConfigService');
    expect(out.eventsLen).toBe(1);
  });
});
