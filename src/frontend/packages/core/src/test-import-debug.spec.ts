import { describe, it, expect } from 'vitest';
import { createBasicStoreModule as storeModule } from '@stratosui/store/testing';
import { createBasicStoreModule as testFrameworkHelper } from '@test-framework/core-test.helper';
import { createBasicStoreModule as testFrameworkIndex } from '@test-framework';

describe('Import Debug', () => {
  it('should import createBasicStoreModule from @stratosui/store/testing', () => {
    expect(storeModule).toBeDefined();
    expect(typeof storeModule).toBe('function');
  });

  it('should import createBasicStoreModule from @test-framework/core-test.helper', () => {
    expect(testFrameworkHelper).toBeDefined();
    expect(typeof testFrameworkHelper).toBe('function');
  });

  it('should import createBasicStoreModule from @test-framework index', () => {
    expect(testFrameworkIndex).toBeDefined();
    expect(typeof testFrameworkIndex).toBe('function');
  });
});
