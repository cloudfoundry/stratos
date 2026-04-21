import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CnsiEntitySource } from './cnsi-entity-source';

class TestItem { constructor(public guid: string) {} }

class TestSource extends CnsiEntitySource<TestItem> {
  protected readonly entityName = 'test';
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
});
