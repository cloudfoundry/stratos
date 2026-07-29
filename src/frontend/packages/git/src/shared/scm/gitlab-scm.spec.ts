import { describe, it, expect } from 'vitest';

import { GitLabSCM } from './gitlab-scm';

describe('GitLabSCM access token', () => {
  it('sets an Authorization: Bearer header when a token is passed to the constructor', () => {
    const scm = new GitLabSCM('', 'pat-abc123');
    const options = (scm as unknown as { options?: { headers?: Record<string, string> } }).options;
    expect(options).toBeDefined();
    expect(options?.headers?.['Authorization']).toBe('Bearer pat-abc123');
  });

  it('does not set options when no token is supplied', () => {
    const scm = new GitLabSCM('');
    const options = (scm as unknown as { options?: unknown }).options;
    expect(options).toBeUndefined();
  });

  it('ignores a whitespace-only token', () => {
    const scm = new GitLabSCM('', '   ');
    const options = (scm as unknown as { options?: unknown }).options;
    expect(options).toBeUndefined();
  });

  it('setAccessToken then clearAccessToken empties the auth headers', () => {
    const scm = new GitLabSCM('');
    scm.setAccessToken('pat-xyz');
    let options = (scm as unknown as { options?: { headers?: Record<string, string> } }).options;
    expect(options?.headers?.['Authorization']).toBe('Bearer pat-xyz');

    scm.clearAccessToken();
    options = (scm as unknown as { options?: { headers?: Record<string, string> } }).options;
    expect(options?.headers).toEqual({});
  });
});
