import { Injectable, inject } from '@angular/core';

import { CfUsersPagedDataService } from '../../shared/data-services/cf-users-paged-data.service';

interface CnsiEntry {
  cfGuid: string;
  entityKey: string | null;
  paginationKey: string | null;
  actionType: string | null;
  events: { ts: number; tag: string; detail?: unknown }[];
  dataSourceRef?: { rowCount: () => number; allRowsCount: () => number; isLoadingPage: () => boolean };
}

@Injectable({ providedIn: 'root' })
export class CfUserListDiagnosticsService {
  private readonly usersData = inject(CfUsersPagedDataService);
  private readonly entries = new Map<string, CnsiEntry>();

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__cfUserListDiag = {
        probe: (cfGuid: string) => this.probe(cfGuid),
        history: () => this.history(),
        keys: () => Array.from(this.entries.keys()),
      };
    }
  }

  ensure(cfGuid: string): CnsiEntry {
    let e = this.entries.get(cfGuid);
    if (!e) {
      e = { cfGuid, entityKey: null, paginationKey: null, actionType: null, events: [] };
      this.entries.set(cfGuid, e);
    }
    return e;
  }

  record(cfGuid: string, tag: string, detail?: unknown): void {
    const e = this.ensure(cfGuid);
    e.events.push({ ts: Date.now(), tag, detail });
  }

  setIdentity(cfGuid: string, entityKey: string, paginationKey: string, actionType: string): void {
    const e = this.ensure(cfGuid);
    e.entityKey = entityKey;
    e.paginationKey = paginationKey;
    e.actionType = actionType;
  }

  setDataSource(cfGuid: string, ds: { rowCount: () => number; allRowsCount: () => number; isLoadingPage: () => boolean }): void {
    this.ensure(cfGuid).dataSourceRef = ds;
  }

  probe(cfGuid: string) {
    const e = this.entries.get(cfGuid);
    if (!e) return { error: `no entry for ${cfGuid}`, knownKeys: Array.from(this.entries.keys()) };
    // Signal-native replacement for the old ngrx selectPaginationState read.
    // cfGuid is the CNSI key for CfUsersPagedDataService; the drained
    // in-memory StUser[] is the single source of truth (no per-page /
    // pageRequests / clientPagination concepts exist in the signal model).
    const loadedUsers = this.usersData.usersSignal(cfGuid)();
    const usersDataSnapshot = {
      loadedCount: loadedUsers.length,
      loadedGuids: loadedUsers.slice(0, 5).map(u => u.guid),
      totalResults: this.usersData.count(cfGuid)(),
      fetching: this.usersData.isLoading(cfGuid)(),
      lastFetched: this.usersData.lastFetched(cfGuid)(),
      error: this.usersData.errorsByCnsi()(cfGuid),
    };
    return {
      cfGuid: e.cfGuid,
      entityKey: e.entityKey,
      paginationKey: e.paginationKey,
      actionType: e.actionType,
      eventsLen: e.events.length,
      eventsTail: e.events.slice(-20).map(ev => ({ tag: ev.tag, ageMs: Date.now() - ev.ts, detail: ev.detail })),
      usersDataSnapshot,
      dataSource: e.dataSourceRef
        ? {
            rowCount: tryCall(() => e.dataSourceRef!.rowCount()),
            allRowsCount: tryCall(() => e.dataSourceRef!.allRowsCount()),
            isLoadingPage: tryCall(() => e.dataSourceRef!.isLoadingPage()),
          }
        : 'no-ds-recorded',
    };
  }

  history() {
    return Array.from(this.entries.values()).map(e => ({
      cfGuid: e.cfGuid,
      entityKey: e.entityKey,
      paginationKey: e.paginationKey,
      actionType: e.actionType,
      events: e.events.map(ev => ({ ts: ev.ts, tag: ev.tag, detail: ev.detail })),
    }));
  }
}

function tryCall<T>(fn: () => T): T | string {
  try { return fn(); } catch (e) { return `err: ${(e as Error).message}`; }
}
