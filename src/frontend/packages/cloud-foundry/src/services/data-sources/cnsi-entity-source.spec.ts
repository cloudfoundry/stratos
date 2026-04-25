import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';

class TestItem { constructor(public guid: string) {} }

class TestSource extends CnsiEntitySource<TestItem> {
  protected readonly entityName = 'test';
}

class TestSourceWithUrlForOne extends CnsiEntitySource<TestItem> {
  protected readonly entityName = 'test';
  protected urlForOne(guid: string): string {
    return `/pp/v1/cf/test/${this.cnsiGuid}/${guid}`;
  }
}

function makeHttp(responses: unknown[]): HttpClient {
  const calls = [...responses];
  return {
    get: vi.fn(() => {
      const next = calls.shift();
      return next instanceof Error ? throwError(() => next) : of(next);
    })
  } as unknown as HttpClient;
}

describe('CnsiEntitySource', () => {
  it('starts idle — items empty, not loading, no error, not done', () => {
    const src = new TestSource('cnsi-1', makeHttp([]));
    expect(src.items()).toEqual([]);
    expect(src.loading()).toBe(false);
    expect(src.error()).toBeNull();
    expect(src.done()).toBe(false);
    expect(src.fetchedPages()).toBe(0);
    expect(src.totalResults()).toBe(0);
  });

  it('load() fetches pages sequentially until pagination.next is null', async () => {
    const page1 = {
      resources: [new TestItem('a'), new TestItem('b')],
      pagination: { totalResults: 3, totalPages: 2, next: { href: '/pp/v1/cf/test/cnsi-1?page=2&per_page=2' }, previous: null, first: { href: '...' }, last: { href: '...' } }
    };
    const page2 = {
      resources: [new TestItem('c')],
      pagination: { totalResults: 3, totalPages: 2, next: null, previous: { href: '...' }, first: { href: '...' }, last: { href: '...' } }
    };
    const src = new TestSource('cnsi-1', makeHttp([page1, page2]));
    await src.load();
    expect(src.items().map(i => i.guid)).toEqual(['a', 'b', 'c']);
    expect(src.loading()).toBe(false);
    expect(src.done()).toBe(true);
    expect(src.fetchedPages()).toBe(2);
    expect(src.totalResults()).toBe(3);
    expect(src.error()).toBeNull();
  });

  it('load() records error and preserves any items already streamed in', async () => {
    const page1 = {
      resources: [new TestItem('a')],
      pagination: { totalResults: 2, totalPages: 2, next: { href: '/pp/v1/cf/test/cnsi-1?page=2&per_page=1' }, previous: null, first: { href: '...' }, last: { href: '...' } }
    };
    const src = new TestSource('cnsi-1', makeHttp([page1, new Error('boom')]));
    await src.load();
    expect(src.items().map(i => i.guid)).toEqual(['a']);
    expect(src.error()).toBeInstanceOf(Error);
    expect(src.done()).toBe(false);
    expect(src.loading()).toBe(false);
  });

  it('refresh() clears state and re-fetches from page 1', async () => {
    const resp = {
      resources: [new TestItem('a')],
      pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '...' }, last: { href: '...' } }
    };
    const http = makeHttp([resp, resp]);
    const src = new TestSource('cnsi-1', http);
    await src.load();
    await src.refresh();
    expect(src.items().map(i => i.guid)).toEqual(['a']);
    expect(src.fetchedPages()).toBe(1);
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('concurrent load() calls share the same in-flight promise — HTTP fires once, both awaits wait for completion', async () => {
    let resolveFirst: ((v: unknown) => void) | null = null;
    const firstCall = new Promise(resolve => { resolveFirst = resolve; });
    const resp = {
      resources: [new TestItem('a')],
      pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '...' }, last: { href: '...' } }
    };
    let callCount = 0;
    const http = {
      get: vi.fn(() => {
        callCount++;
        return callCount === 1
          ? // first call: wait on firstCall before emitting
            new Observable(sub => { firstCall.then(() => { sub.next(resp); sub.complete(); }); })
          : of(resp);
      }),
    } as unknown as HttpClient;
    const src = new TestSource('cnsi-1', http);

    const p1 = src.load();
    const p2 = src.load();
    // When p2 resolves, loading must be complete — not returned early while
    // the first load is still in flight. Assert state is stable AT p2's
    // resolution point by checking loading === false in the .then.
    let p2LoadingAtResolve: boolean | null = null;
    let p2ItemsAtResolve: string[] | null = null;
    const p2Checked = p2.then(() => {
      p2LoadingAtResolve = src.loading();
      p2ItemsAtResolve = src.items().map(i => i.guid);
    });
    resolveFirst!(null);
    await Promise.all([p1, p2Checked]);

    expect(callCount).toBe(1);
    expect(src.items().map(i => i.guid)).toEqual(['a']);
    expect(p2LoadingAtResolve).toBe(false);
    expect(p2ItemsAtResolve).toEqual(['a']);
  });

  describe('byGuid', () => {
    it('returns undefined for unknown guid before any load', () => {
      const src = new TestSource('cnsi-1', makeHttp([]));
      expect(src.byGuid('a')()).toBeUndefined();
    });

    it('returns the item once loaded', async () => {
      const resp = {
        resources: [new TestItem('a'), new TestItem('b')],
        pagination: { totalResults: 2, totalPages: 1, next: null, previous: null, first: { href: '...' }, last: { href: '...' } }
      };
      const src = new TestSource('cnsi-1', makeHttp([resp]));
      await src.load();
      expect(src.byGuid('a')()?.guid).toBe('a');
      expect(src.byGuid('b')()?.guid).toBe('b');
      expect(src.byGuid('c')()).toBeUndefined();
    });

    it('is reactive — recomputes when items change', async () => {
      const page1 = {
        resources: [new TestItem('a')],
        pagination: { totalResults: 2, totalPages: 2, next: { href: '/p2' }, previous: null, first: { href: '...' }, last: { href: '...' } }
      };
      const page2 = {
        resources: [new TestItem('b')],
        pagination: { totalResults: 2, totalPages: 2, next: null, previous: { href: '...' }, first: { href: '...' }, last: { href: '...' } }
      };
      const src = new TestSource('cnsi-1', makeHttp([page1, page2]));
      const sigB = src.byGuid('b');
      expect(sigB()).toBeUndefined();
      await src.load();
      expect(sigB()?.guid).toBe('b');
    });
  });

  describe('loadOne', () => {
    it('is a no-op when guid already cached', async () => {
      const resp = {
        resources: [new TestItem('a')],
        pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '...' }, last: { href: '...' } }
      };
      const http = makeHttp([resp]);
      const src = new TestSource('cnsi-1', http);
      await src.load();
      expect(http.get).toHaveBeenCalledTimes(1);
      await src.loadOne('a');
      expect(http.get).toHaveBeenCalledTimes(1); // no extra call
    });

    it('falls back to full load() when urlForOne is not implemented', async () => {
      const resp = {
        resources: [new TestItem('a'), new TestItem('b')],
        pagination: { totalResults: 2, totalPages: 1, next: null, previous: null, first: { href: '...' }, last: { href: '...' } }
      };
      const src = new TestSource('cnsi-1', makeHttp([resp]));
      await src.loadOne('a');
      // Full drain happened; both items present.
      expect(src.items().map(i => i.guid)).toEqual(['a', 'b']);
      expect(src.byGuid('a')()?.guid).toBe('a');
    });

    it('uses single GET via urlForOne when implemented and stamps cnsiGuid', async () => {
      const single = new TestItem('a');
      const http = makeHttp([single]);
      const src = new TestSourceWithUrlForOne('cnsi-1', http);
      await src.loadOne('a');
      expect(http.get).toHaveBeenCalledWith('/pp/v1/cf/test/cnsi-1/a');
      expect(src.items().length).toBe(1);
      expect(src.byGuid('a')()?.guid).toBe('a');
      expect((src.byGuid('a')() as any).cnsiGuid).toBe('cnsi-1');
    });

    it('replaces an existing item when single-GET refetches a cached guid', async () => {
      const seed = {
        resources: [{ guid: 'a', name: 'old' } as any],
        pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '...' }, last: { href: '...' } }
      };
      const fresh = { guid: 'a', name: 'new' };
      // Force loadOne to hit the single-GET path even though 'a' is cached:
      // we evict the cache by calling refresh and seeding. Easier: clear cache by directly invoking _doLoadOne semantics through a fresh source where item is patched in.
      const src = new TestSourceWithUrlForOne('cnsi-1', makeHttp([seed, fresh]));
      await src.load();
      // Now 'a' is cached. To exercise the replace branch, we call loadOne on
      // a different guid first to verify caching, then expose the merge by
      // simulating an out-of-band refresh: drop and re-fetch via _doLoadOne.
      // Simplest: mutate items to remove cnsi stamp and re-fetch via internal
      // call path — but loadOne short-circuits on cached. So we test the
      // replace branch by directly invoking _doLoadOne via a subclass hook.
      await (src as any)._doLoadOne('a');
      const item = src.byGuid('a')() as any;
      expect(item.name).toBe('new');
      expect(src.items().length).toBe(1); // replaced, not appended
    });

    it('waits for in-flight load() instead of firing a parallel single-GET', async () => {
      let resolveDrain: ((v: unknown) => void) | null = null;
      const drainPromise = new Promise(resolve => { resolveDrain = resolve; });
      const drainResp = {
        resources: [new TestItem('a')],
        pagination: { totalResults: 1, totalPages: 1, next: null, previous: null, first: { href: '...' }, last: { href: '...' } }
      };
      let callCount = 0;
      const http = {
        get: vi.fn(() => {
          callCount++;
          return new Observable(sub => {
            drainPromise.then(() => { sub.next(drainResp); sub.complete(); });
          });
        })
      } as unknown as HttpClient;
      const src = new TestSourceWithUrlForOne('cnsi-1', http);
      const drain = src.load();
      const one = src.loadOne('a');
      resolveDrain!(null);
      await Promise.all([drain, one]);
      // Only the drain GET fired; loadOne piggybacked on it.
      expect(callCount).toBe(1);
      expect(src.byGuid('a')()?.guid).toBe('a');
    });

    it('de-dups concurrent loadOne(same guid) calls', async () => {
      let resolveOne: ((v: unknown) => void) | null = null;
      const onePromise = new Promise(resolve => { resolveOne = resolve; });
      const single = new TestItem('a');
      let callCount = 0;
      const http = {
        get: vi.fn(() => {
          callCount++;
          return new Observable(sub => {
            onePromise.then(() => { sub.next(single); sub.complete(); });
          });
        })
      } as unknown as HttpClient;
      const src = new TestSourceWithUrlForOne('cnsi-1', http);
      const p1 = src.loadOne('a');
      const p2 = src.loadOne('a');
      resolveOne!(null);
      await Promise.all([p1, p2]);
      expect(callCount).toBe(1); // de-duped
      expect(src.byGuid('a')()?.guid).toBe('a');
    });

    it('allows concurrent loadOne(different guids) to proceed in parallel', async () => {
      const a = new TestItem('a');
      const b = new TestItem('b');
      const calls: string[] = [];
      const http = {
        get: vi.fn((url: string) => {
          calls.push(url);
          return of(url.endsWith('/a') ? a : b);
        })
      } as unknown as HttpClient;
      const src = new TestSourceWithUrlForOne('cnsi-1', http);
      await Promise.all([src.loadOne('a'), src.loadOne('b')]);
      expect(calls.length).toBe(2);
      expect(src.items().map(i => i.guid).sort()).toEqual(['a', 'b']);
    });
  });
});
