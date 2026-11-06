import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';

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

describe('GitLabSCM nested subgroups', () => {
  // Point the SCM at the public API root so getAPI() (no registered endpoint)
  // returns { url: <root> } and we can assert the exact request URL.
  const makeScm = () => {
    const scm = new GitLabSCM('');
    (scm as unknown as { publicApiUrl: string }).publicApiUrl = 'https://workshop.cloud.gov/api/v4';
    return scm;
  };

  it('getRepository URL-encodes a nested group/subgroup/project path whole', () => {
    const scm = makeScm();
    const get = vi.fn().mockReturnValue(of({ path_with_namespace: 'cloud-gov/platform/rag-demo', namespace: { name: 'platform' } }));
    const httpClient = { get } as any;

    scm.getRepository(httpClient, 'cloud-gov/platform/rag-demo').pipe(take(1)).subscribe();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toBe(
      'https://workshop.cloud.gov/api/v4/projects/cloud-gov%2Fplatform%2Frag-demo'
    );
  });

  it('getRepository still resolves a simple two-segment path', () => {
    const scm = makeScm();
    const get = vi.fn().mockReturnValue(of({ path_with_namespace: 'group/repo', namespace: { name: 'group' } }));
    const httpClient = { get } as any;

    scm.getRepository(httpClient, 'group/repo').pipe(take(1)).subscribe();

    expect(get.mock.calls[0][0]).toBe('https://workshop.cloud.gov/api/v4/projects/group%2Frepo');
  });

  it('getMatchingRepositories searches the group namespace (with subgroups), not /users, for a nested path', () => {
    const scm = makeScm();
    const get = vi.fn().mockReturnValue(of([]));
    const httpClient = { get } as any;

    scm.getMatchingRepositories(httpClient, 'cloud-gov/platform/rag').pipe(take(1)).subscribe();

    const urls = get.mock.calls.map((c: unknown[]) => c[0] as string);
    // Nested namespace is not a user, so the /users lookup must be skipped.
    expect(urls.some(u => u.includes('/users/'))).toBe(false);
    // The namespace (cloud-gov/platform) is URL-encoded and subgroups included.
    expect(urls).toContain(
      'https://workshop.cloud.gov/api/v4/groups/cloud-gov%2Fplatform/projects?search=rag&include_subgroups=true'
    );
  });

  // The search term is user input landing in a query string. An unescaped &
  // would truncate the parameter and a space would make the URL invalid.
  it('getMatchingRepositories URL-encodes the search term', () => {
    const scm = makeScm();
    const get = vi.fn().mockReturnValue(of([]));
    const httpClient = { get } as any;

    scm.getMatchingRepositories(httpClient, 'someuser/a&b c').pipe(take(1)).subscribe();

    const urls = get.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(urls.every(u => u.includes('search=a%26b%20c'))).toBe(true);
    expect(urls.some(u => u.includes('search=a&b'))).toBe(false);
  });

  it('getMatchingRepositories still tries the /users lookup for a single-segment namespace', () => {
    const scm = makeScm();
    const get = vi.fn().mockReturnValue(of([]));
    const httpClient = { get } as any;

    scm.getMatchingRepositories(httpClient, 'someuser/rag').pipe(take(1)).subscribe();

    const urls = get.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(urls).toContain('https://workshop.cloud.gov/api/v4/users/someuser/projects/?search=rag');
    expect(urls).toContain('https://workshop.cloud.gov/api/v4/groups/someuser/projects?search=rag&include_subgroups=true');
  });
});
