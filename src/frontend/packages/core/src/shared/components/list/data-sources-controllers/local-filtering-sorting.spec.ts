import { describe, it, expect } from 'vitest';
import { APIResource, PaginationEntityState } from '@stratosui/store';
import { getFilterFunction } from './local-filtering-sorting';

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
});
