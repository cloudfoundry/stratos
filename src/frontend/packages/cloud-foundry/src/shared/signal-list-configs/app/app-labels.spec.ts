import { describe, it, expect } from 'vitest';
import { labelError } from './app-labels';

describe('labelError', () => {
  it('accepts labels Cloud Foundry accepts', () => {
    for (const [key, value] of [
      ['team', 'platform'],
      ['a', ''],
      ['example.com/team', 'Platform_1.2-x'],
      ['my_key.v-2', 'z'],
      ['x'.repeat(63), 'y'.repeat(63)],
    ]) {
      expect(labelError(key, value), `${key}=${value}`).toBeNull();
    }
  });

  it('rejects keys the way Cloud Foundry does', () => {
    expect(labelError('', 'v')).toBe('Label key cannot be empty.');
    expect(labelError('a/b/c', 'v')).toBe('Label key has more than one "/".');
    expect(labelError('team/x', 'v')).toBe('Label prefix "team" must be a DNS name, such as example.com.');
    expect(labelError('/x', 'v')).toBe('Label prefix "" must be a DNS name, such as example.com.');
    expect(labelError(`${Array(5).fill('a'.repeat(60)).join('.')}/x`, 'v')).toBe('Label prefix is longer than 253 characters.');
    expect(labelError('CloudFoundry.org/x', 'v')).toBe('Label prefix "cloudfoundry.org" is reserved.');
    expect(labelError('example.com/', 'v')).toBe('Label key cannot be empty.');
    expect(labelError('team@x', 'v')).toBe('Label key "team@x" may only use letters, digits, "-", "_" and ".".');
    expect(labelError('my key', 'v')).toBe('Label key "my key" may only use letters, digits, "-", "_" and ".".');
    expect(labelError('-team', 'v')).toBe('Label key "-team" must start and end with a letter or digit.');
    expect(labelError('x'.repeat(64), 'v')).toBe('Label key is longer than 63 characters.');
  });

  it('rejects values the way Cloud Foundry does', () => {
    expect(labelError('k', 'a=b')).toBe('Label value "a=b" may only use letters, digits, "-", "_" and ".".');
    expect(labelError('k', 'with space')).toBe('Label value "with space" may only use letters, digits, "-", "_" and ".".');
    expect(labelError('k', 'v_')).toBe('Label value "v_" must start and end with a letter or digit.');
    expect(labelError('k', 'v'.repeat(64))).toBe('Label value is longer than 63 characters.');
  });
});
