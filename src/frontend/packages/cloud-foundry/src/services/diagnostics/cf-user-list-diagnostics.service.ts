import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

import { CFAppState } from '@stratosui/cloud-foundry';
import { selectPaginationState } from '@stratosui/store';

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
  private readonly store = inject(Store<CFAppState>);
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
    let paginationSnapshot: unknown = 'not-read';
    if (e.entityKey && e.paginationKey) {
      this.store.select(selectPaginationState(e.entityKey, e.paginationKey))
        .pipe(take(1))
        .subscribe(p => {
          paginationSnapshot = p
            ? {
                hasState: true,
                idsLen: p.ids ? Object.keys(p.ids).length : 0,
                idsKeys: p.ids ? Object.keys(p.ids).slice(0, 5) : [],
                pageRequestsLen: p.pageRequests ? Object.keys(p.pageRequests).length : 0,
                pageRequestsKeys: p.pageRequests ? Object.keys(p.pageRequests).slice(0, 5) : [],
                currentPage: (p as any).currentPage,
                totalResults: (p as any).totalResults,
                pageCount: (p as any).pageCount,
                fetching: (p as any).fetching,
                error: (p as any).error,
                clientPagination: (p as any).clientPagination,
              }
            : { hasState: false };
        });
    }
    return {
      cfGuid: e.cfGuid,
      entityKey: e.entityKey,
      paginationKey: e.paginationKey,
      actionType: e.actionType,
      eventsLen: e.events.length,
      eventsTail: e.events.slice(-20).map(ev => ({ tag: ev.tag, ageMs: Date.now() - ev.ts, detail: ev.detail })),
      paginationSnapshot,
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
