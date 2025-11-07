import { describe, it, expect } from 'vitest';
import { createBasicStoreModule as storeModule } from '@stratosui/store/testing';
import { createBasicStoreModule as testFrameworkHelper } from '@test-framework/core-test.helper';
import { createBasicStoreModule as testFrameworkIndex } from '@test-framework';

describe('Import Debug', () => {
  it('should import createBasicStoreModule from @stratosui/store/testing', () => {
    console.log('Direct import type:', typeof storeModule);
    console.log('Direct import value:', storeModule);
    expect(storeModule).toBeDefined();
    expect(typeof storeModule).toBe('function');
  });

  it('should import createBasicStoreModule from @test-framework/core-test.helper', () => {
    console.log('Test framework helper import type:', typeof testFrameworkHelper);
    console.log('Test framework helper value:', testFrameworkHelper);
    expect(testFrameworkHelper).toBeDefined();
    expect(typeof testFrameworkHelper).toBe('function');
  });

  it('should import createBasicStoreModule from @test-framework index', () => {
    console.log('Test framework index import type:', typeof testFrameworkIndex);
    console.log('Test framework index value:', testFrameworkIndex);
    expect(testFrameworkIndex).toBeDefined();
    expect(typeof testFrameworkIndex).toBe('function');
  });
});
