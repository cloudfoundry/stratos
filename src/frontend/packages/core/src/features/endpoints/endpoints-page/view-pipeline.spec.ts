import { describe, it, expect } from 'vitest';
import { signal } from '@angular/core';

import { ViewPipeline, SortSpec } from './endpoints-signal-config.service';

type Row = { name: string };

function makePipeline(names: string[], pageSize: number, pageIndex = 0) {
  const items = signal<Row[]>(names.map(name => ({ name })));
  return new ViewPipeline<Row>(
    items.asReadonly(),
    signal<(row: Row) => boolean>(() => true).asReadonly(),
    signal<SortSpec<Row>>({ field: 'name', direction: 'asc' }).asReadonly(),
    signal(pageSize).asReadonly(),
    signal(pageIndex).asReadonly(),
  );
}

describe('ViewPipeline paging', () => {
  it('slices to the page window for a positive page size', () => {
    const pipeline = makePipeline(['a', 'b', 'c', 'd', 'e'], 2, 1);
    expect(pipeline.pagedItems().map(r => r.name)).toEqual(['c', 'd']);
    expect(pipeline.totalPages()).toBe(3);
  });

  it('returns every item for the All page size (-1)', () => {
    const pipeline = makePipeline(['a', 'b', 'c', 'd', 'e'], -1);
    expect(pipeline.pagedItems().map(r => r.name)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(pipeline.totalPages()).toBe(1);
  });

  it('reports zero pages for All on an empty list', () => {
    const pipeline = makePipeline([], -1);
    expect(pipeline.pagedItems()).toEqual([]);
    expect(pipeline.totalPages()).toBe(0);
  });
});
