import { describe, it, expect } from 'vitest';
import { APIResource, PaginationEntityState } from '@stratosui/store';
import { getDataFunctionList, getFilterFunction } from './local-filtering-sorting';

/**
 * Tests for local filtering and sorting utility functions.
 * These tests were extracted from list.component.spec.ts where they were incorrectly
 * placed in a skipped integration test suite. These are pure function tests with no
 * dependencies on components or entity catalog.
 */
describe('local-filtering-sorting', () => {
  describe('getFilterFunction', () => {
    /**
     * Helper to create a pagination state with a filter string
     */
    const createPaginationState = (filterString: string): PaginationEntityState => ({
      currentPage: 1,
      totalResults: 2,
      pageCount: 1,
      ids: {},
      params: {},
      pageRequests: {},
      clientPagination: {
        pageSize: 10,
        currentPage: 1,
        filter: {
          string: filterString,
          items: {}
        },
        totalResults: 2,
      },
      maxedState: {},
      isListPagination: false,
    });

    describe('filtering by nested fields', () => {
      it('should filter entities by label (entity.label)', () => {
        const filterByLabel = getFilterFunction({
          type: 'filter',
          field: 'entity.label'
        });

        const entities: APIResource[] = [
          {
            metadata: { created_at: '2025-02-02', guid: '1', updated_at: '2025-02-03', url: '/url1' },
            entity: { label: 'hello' }
          },
          {
            metadata: { created_at: '2022-01-02', guid: '2', updated_at: '2022-01-03', url: '/url2' },
            entity: { label: 'world' }
          },
        ];

        const result = filterByLabel(entities, createPaginationState('hello'));

        expect(result.length).toBe(1);
        expect(result[0].entity.label).toEqual('hello');
      });

      it('should filter entities by tags (entity.tags)', () => {
        const filterByTags = getFilterFunction({
          type: 'filter',
          field: 'entity.tags'
        });

        const entities: APIResource[] = [
          {
            metadata: { created_at: '2025-02-02', guid: '1', updated_at: '2025-02-03', url: '/url1' },
            entity: { tags: ['hello', 'world'] }
          },
          {
            metadata: { created_at: '2022-01-02', guid: '2', updated_at: '2022-01-03', url: '/url2' },
            entity: { tags: ['bye', 'world'] }
          },
        ];

        const result = filterByTags(entities, createPaginationState('hello'));

        expect(result.length).toBe(1);
        expect(result[0].entity.tags).toEqual(['hello', 'world']);
      });
    });

    describe('filtering by simple fields', () => {
      it('should filter entities by simple string field', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'name' });
        const entities = [
          { name: 'hello' },
          { name: 'world' },
        ];
        const result = filter(entities, createPaginationState('hello'));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('hello');
      });

      it('should filter entities by nested object field', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'metadata.guid' });
        const entities: APIResource[] = [
          {
            metadata: { created_at: '', guid: 'abc-123', updated_at: '', url: '' },
            entity: {}
          },
          {
            metadata: { created_at: '', guid: 'def-456', updated_at: '', url: '' },
            entity: {}
          },
        ];
        const result = filter(entities, createPaginationState('abc'));

        expect(result).toHaveLength(1);
        expect(result[0].metadata.guid).toBe('abc-123');
      });
    });

    describe('case sensitivity', () => {
      it('should be case-insensitive', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'name' });
        const entities = [{ name: 'Hello World' }];

        const result1 = filter(entities, createPaginationState('HELLO'));
        expect(result1).toHaveLength(1);

        const result2 = filter(entities, createPaginationState('hello'));
        expect(result2).toHaveLength(1);

        const result3 = filter(entities, createPaginationState('HeLLo'));
        expect(result3).toHaveLength(1);
      });
    });

    describe('edge cases', () => {
      it('should return all entities when filter string is empty', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'name' });
        const entities = [{ name: 'hello' }, { name: 'world' }];
        const result = filter(entities, createPaginationState(''));

        expect(result).toHaveLength(2);
      });

      it('should return empty array when no entities match', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'name' });
        const entities = [{ name: 'hello' }, { name: 'world' }];
        const result = filter(entities, createPaginationState('notfound'));

        expect(result).toHaveLength(0);
      });

      it('should handle entities with missing field gracefully', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'name' });
        const entities = [
          { name: 'hello' },
          { other: 'field' } as any, // Missing 'name' field
          { name: 'world' },
        ];
        const result = filter(entities, createPaginationState('hello'));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('hello');
      });

      it('should handle null and undefined values', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'name' });
        const entities = [
          { name: 'hello' },
          { name: null } as any,
          { name: undefined } as any,
          { name: 'world' },
        ];
        const result = filter(entities, createPaginationState('hello'));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('hello');
      });
    });

    describe('array field filtering', () => {
      it('should match any element in an array field', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'tags' });
        const entities = [
          { tags: ['hello', 'world', 'foo'] },
          { tags: ['bar', 'baz'] },
          { tags: ['hello', 'bar'] },
        ];
        const result = filter(entities, createPaginationState('hello'));

        expect(result).toHaveLength(2);
        expect(result[0].tags).toContain('hello');
        expect(result[1].tags).toContain('hello');
      });

      it('should handle empty arrays', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'tags' });
        const entities = [
          { tags: ['hello'] },
          { tags: [] },
          { tags: ['world'] },
        ];
        const result = filter(entities, createPaginationState('hello'));

        expect(result).toHaveLength(1);
        expect(result[0].tags).toEqual(['hello']);
      });
    });

    describe('partial matching', () => {
      it('should match partial strings', () => {
        const filter = getFilterFunction({ type: 'filter', field: 'description' });
        const entities = [
          { description: 'This is a hello world example' },
          { description: 'Goodbye cruel world' },
          { description: 'Hello there' },
        ];
        const result = filter(entities, createPaginationState('hello'));

        expect(result).toHaveLength(2);
        expect(result[0].description).toContain('hello');
        expect(result[1].description).toContain('Hello');
      });
    });
  });

  describe('sort functions', () => {
    const createSortPaginationState = (orderKey: string, direction: string): PaginationEntityState => ({
      currentPage: 1,
      totalResults: 0,
      pageCount: 1,
      ids: {},
      params: {
        'order-direction-field': orderKey,
        'order-direction': direction,
      },
      pageRequests: {},
      clientPagination: {
        pageSize: 10,
        currentPage: 1,
        filter: { string: '', items: {} },
        totalResults: 0,
      },
      maxedState: {},
      isListPagination: false,
    });

    describe('lexicographic sort (type: sort)', () => {
      it('sorts strings lexicographically', () => {
        const [sortFn] = getDataFunctionList([{ type: 'sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'cherry' }, { name: 'apple' }, { name: 'banana' }];
        const result = sortFn(entities, createSortPaginationState('name', 'desc'));
        expect(result.map(e => e.name)).toEqual(['apple', 'banana', 'cherry']);
      });

      it('puts app-10 before app-2 (documenting lexicographic behavior)', () => {
        const [sortFn] = getDataFunctionList([{ type: 'sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'app-1' }, { name: 'app-10' }, { name: 'app-2' }];
        const result = sortFn(entities, createSortPaginationState('name', 'desc'));
        expect(result.map(e => e.name)).toEqual(['app-1', 'app-10', 'app-2']);
      });

      it('reverses order with asc direction', () => {
        const [sortFn] = getDataFunctionList([{ type: 'sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'apple' }, { name: 'cherry' }, { name: 'banana' }];
        const result = sortFn(entities, createSortPaginationState('name', 'asc'));
        expect(result.map(e => e.name)).toEqual(['cherry', 'banana', 'apple']);
      });

      it('returns entities unchanged when orderKey does not match', () => {
        const [sortFn] = getDataFunctionList([{ type: 'sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'cherry' }, { name: 'apple' }];
        const result = sortFn(entities, createSortPaginationState('other', 'asc'));
        expect(result.map(e => e.name)).toEqual(['cherry', 'apple']);
      });
    });

    describe('natural sort (type: natural-sort)', () => {
      // Note: the existing sort convention is inverted — 'desc' produces A-Z, 'asc' produces Z-A.
      // Natural sort matches this convention for consistency with the UI toggle.

      it('sorts numeric segments naturally', () => {
        const [sortFn] = getDataFunctionList([{ type: 'natural-sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'app-1' }, { name: 'app-10' }, { name: 'app-2' }, { name: 'app-20' }, { name: 'app-3' }];
        const result = sortFn(entities, createSortPaginationState('name', 'desc'));
        expect(result.map(e => e.name)).toEqual(['app-1', 'app-2', 'app-3', 'app-10', 'app-20']);
      });

      it('sorts pure alpha strings alphabetically', () => {
        const [sortFn] = getDataFunctionList([{ type: 'natural-sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'cherry' }, { name: 'apple' }, { name: 'banana' }];
        const result = sortFn(entities, createSortPaginationState('name', 'desc'));
        expect(result.map(e => e.name)).toEqual(['apple', 'banana', 'cherry']);
      });

      it('is case-insensitive', () => {
        const [sortFn] = getDataFunctionList([{ type: 'natural-sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'App-10' }, { name: 'app-1' }, { name: 'APP-2' }];
        const result = sortFn(entities, createSortPaginationState('name', 'desc'));
        expect(result.map(e => e.name)).toEqual(['app-1', 'APP-2', 'App-10']);
      });

      it('reverses order with asc direction', () => {
        const [sortFn] = getDataFunctionList([{ type: 'natural-sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'app-1' }, { name: 'app-10' }, { name: 'app-2' }];
        const result = sortFn(entities, createSortPaginationState('name', 'asc'));
        expect(result.map(e => e.name)).toEqual(['app-10', 'app-2', 'app-1']);
      });

      it('handles nested fields', () => {
        const [sortFn] = getDataFunctionList([{ type: 'natural-sort', orderKey: 'name', field: 'entity.name' }]);
        const entities = [
          { entity: { name: 'space-10' } },
          { entity: { name: 'space-2' } },
          { entity: { name: 'space-1' } },
        ];
        const result = sortFn(entities, createSortPaginationState('name', 'desc'));
        expect(result.map(e => e.entity.name)).toEqual(['space-1', 'space-2', 'space-10']);
      });

      it('handles missing field values', () => {
        const [sortFn] = getDataFunctionList([{ type: 'natural-sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'beta' }, { other: 'field' } as any, { name: 'alpha' }];
        expect(() => sortFn(entities, createSortPaginationState('name', 'asc'))).not.toThrow();
      });

      it('returns entities unchanged when orderKey does not match', () => {
        const [sortFn] = getDataFunctionList([{ type: 'natural-sort', orderKey: 'name', field: 'name' }]);
        const entities = [{ name: 'app-10' }, { name: 'app-2' }];
        const result = sortFn(entities, createSortPaginationState('other', 'asc'));
        expect(result.map(e => e.name)).toEqual(['app-10', 'app-2']);
      });
    });
  });
});
