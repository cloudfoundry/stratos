import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect } from 'vitest';

import { GitHubSCM } from './github-scm';
import { GitLabSCM } from './gitlab-scm';

// A browser call the page's Content-Security-Policy refuses reaches the app as
// status 0 with no body, indistinguishable from the network being down, and
// used to read only "Git request failed". The message has to name the host
// and the two ways to allow it, for either provider.
describe.each([
  ['GitHub', () => new GitHubSCM('https://api.github.com', ''), 'https://api.github.com/search/repositories?q=o/r'],
  ['GitLab', () => new GitLabSCM(''), 'https://git.example.com/api/v4/projects/o%2Fr'],
])('%s parseErrorAsString', (_name, makeScm, blockedUrl) => {
  it('names an unreachable Git host and how to allow it', () => {
    const origin = new URL(blockedUrl).origin;
    const message = makeScm().parseErrorAsString(new HttpErrorResponse({ status: 0, url: blockedUrl }));
    expect(message).toContain(`Could not reach ${origin}`);
    expect(message).toContain('CONSOLE_CSP_GIT_HOSTS');
    expect(message).toContain('Git endpoint');
  });

  it('does not blame the policy when the console itself is unreachable', () => {
    const message = makeScm().parseErrorAsString(new HttpErrorResponse({ status: 0, url: '/api/v1/proxy/ep-1/repos/o/r' }));
    expect(message).not.toContain('CONSOLE_CSP_GIT_HOSTS');
  });

  it('keeps the status for a refusal from the Git host', () => {
    const message = makeScm().parseErrorAsString(new HttpErrorResponse({ status: 404, url: blockedUrl }));
    expect(message).toBe('Git request failed(404)');
  });
});
