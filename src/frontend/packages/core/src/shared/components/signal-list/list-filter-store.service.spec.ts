import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { ListFilterStore, ListFilterDefaults } from './list-filter-store.service';

const KEY = 'test-list';
const STORAGE = 'stratos.list-filters.v1.' + KEY;

const DEFAULTS: ListFilterDefaults = {
  nameFilter: '',
  filterField: 'name',
  multiFilters: {},
};

function flushEffects() {
  TestBed.inject(ApplicationRef).tick();
}

describe('ListFilterStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('returns defaults when nothing persisted', () => {
    const store = TestBed.inject(ListFilterStore);
    const bound = store.bind(KEY, DEFAULTS);
    expect(bound.nameFilter()).toBe('');
    expect(bound.filterField()).toBe('name');
    expect(bound.multiFilters()).toEqual({});
  });

  it('persists writes to localStorage', () => {
    const store = TestBed.inject(ListFilterStore);
    const bound = store.bind(KEY, DEFAULTS);
    bound.nameFilter.set('foo');
    bound.filterField.set('cf');
    bound.setMultiFilter('cf', 'cf-1');
    flushEffects();
    const raw = localStorage.getItem(STORAGE);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.nameFilter).toBe('foo');
    expect(parsed.filterField).toBe('cf');
    expect(parsed.multiFilters).toEqual({ cf: 'cf-1' });
  });

  it('rehydrates persisted values on bind', () => {
    localStorage.setItem(STORAGE, JSON.stringify({
      nameFilter: 'rehydrated',
      filterField: 'org',
      multiFilters: { org: 'org-1' },
    }));
    const store = TestBed.inject(ListFilterStore);
    const bound = store.bind(KEY, DEFAULTS);
    expect(bound.nameFilter()).toBe('rehydrated');
    expect(bound.filterField()).toBe('org');
    expect(bound.multiFilterValue('org')()).toBe('org-1');
  });

  it('falls back to defaults when persisted JSON is malformed', () => {
    localStorage.setItem(STORAGE, '{ this is not json');
    const store = TestBed.inject(ListFilterStore);
    const bound = store.bind(KEY, DEFAULTS);
    expect(bound.nameFilter()).toBe('');
  });

  it('falls back to defaults when persisted shape mismatches', () => {
    localStorage.setItem(STORAGE, JSON.stringify({ nameFilter: 42 }));
    const store = TestBed.inject(ListFilterStore);
    const bound = store.bind(KEY, DEFAULTS);
    expect(bound.nameFilter()).toBe('');
  });

  it('clear() resets every field to the supplied defaults', () => {
    const store = TestBed.inject(ListFilterStore);
    const bound = store.bind(KEY, { nameFilter: 'init', filterField: 'name', multiFilters: { cf: null } });
    bound.nameFilter.set('typed');
    bound.setMultiFilter('cf', 'cf-1');
    bound.clear();
    expect(bound.nameFilter()).toBe('init');
    expect(bound.multiFilterValue('cf')()).toBeNull();
  });

  it('multiFilterValue returns null for unknown keys', () => {
    const store = TestBed.inject(ListFilterStore);
    const bound = store.bind(KEY, DEFAULTS);
    expect(bound.multiFilterValue('missing')()).toBeNull();
  });
});
