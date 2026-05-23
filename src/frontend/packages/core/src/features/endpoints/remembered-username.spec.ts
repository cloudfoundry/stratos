import { describe, it, expect, beforeEach } from 'vitest';
import { rememberUsername, forgetRememberedUsername, rememberedUsernameKey } from './remembered-username';

describe('remembered-username', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a username for a given endpoint guid', () => {
    rememberUsername('ep-1', 'alice');
    expect(window.localStorage.getItem(rememberedUsernameKey('ep-1'))).toBe('alice');
  });

  it('keeps usernames per-endpoint', () => {
    rememberUsername('ep-1', 'alice');
    rememberUsername('ep-2', 'bob');
    expect(window.localStorage.getItem(rememberedUsernameKey('ep-1'))).toBe('alice');
    expect(window.localStorage.getItem(rememberedUsernameKey('ep-2'))).toBe('bob');
  });

  it('ignores empty usernames so we never persist a placeholder', () => {
    rememberUsername('ep-1', '');
    expect(window.localStorage.getItem(rememberedUsernameKey('ep-1'))).toBeNull();
  });

  it('forgetRememberedUsername clears the entry', () => {
    rememberUsername('ep-1', 'alice');
    forgetRememberedUsername('ep-1');
    expect(window.localStorage.getItem(rememberedUsernameKey('ep-1'))).toBeNull();
  });
});
