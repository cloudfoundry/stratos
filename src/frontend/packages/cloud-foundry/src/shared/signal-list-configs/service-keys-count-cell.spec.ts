import { describe, it, expect } from 'vitest';

import type { StServiceInstance } from '../../services/endpoint-data/stratos-types';
import { renderServiceKeyCount, serviceKeysLink } from './service-keys-count-cell';

const managed = (): StServiceInstance => ({
  guid: 'si-1', cnsiGuid: 'cf-1', name: 'cache', type: 'managed',
} as StServiceInstance);

describe('renderServiceKeyCount', () => {
  it('renders an em-dash when the count is not yet known', () => {
    expect(renderServiceKeyCount(managed(), undefined)).toBe('—');
  });

  it('renders 0 distinctly from unknown', () => {
    expect(renderServiceKeyCount(managed(), 0)).toBe('0');
  });

  it('renders a known positive count', () => {
    expect(renderServiceKeyCount(managed(), 3)).toBe('3');
  });
});

describe('serviceKeysLink', () => {
  it('links a managed instance to its keys page', () => {
    expect(serviceKeysLink(managed())).toEqual(['/services', 'service', 'cf-1', 'si-1', 'keys']);
  });

  it('returns null for a user-provided instance (no keys page)', () => {
    const ups = { guid: 'ups-1', cnsiGuid: 'cf-1', name: 'ups', type: 'user-provided' } as StServiceInstance;
    expect(serviceKeysLink(ups)).toBeNull();
  });
});
