import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import { GitDataService } from './git-data.service';
import { GitBranch, GitCommit, GitRepo } from '../store/git.public-types';
import { GitSCM } from './scm/scm';

/**
 * Minimal fake GitSCM — GitDataService delegates the actual HTTP to the SCM
 * instance (exactly as the old GitEffects did), so the SCM methods are the
 * seam we drive in these tests.
 */
function makeScm(overrides: Partial<GitSCM> = {}): GitSCM {
  return {
    endpointGuid: 'ep-1',
    getType: () => 'github',
    getLabel: () => 'GitHub',
    getIcon: () => ({ iconName: 'github', fontName: 'stratos-icons' }),
    getPublicApi: () => 'https://api.github.com',
    getAPI: () => of(null as any),
    getRepository: () => of({ full_name: 'org/repo', clone_url: 'url', default_branch: 'main' } as GitRepo),
    getBranch: () => of({ name: 'main', commit: { sha: 'abc' } } as GitBranch),
    getBranches: () => of([{ name: 'main' }, { name: 'dev' }] as GitBranch[]),
    getCommit: () => of({ sha: 'abc' } as GitCommit),
    convertCommit: (c: any) => c,
    getCommits: () => of([{ sha: 'abc' }, { sha: 'def' }] as GitCommit[]),
    getCommitApi: () => of(null as any),
    getCompareCommitURL: () => '',
    getMatchingRepositories: () => of([]),
    parseErrorAsString: (e: any) => (e && e.message) || 'error',
    ...overrides,
  } as GitSCM;
}

/**
 * A GitSCM whose lookups go through the HttpClient the service passes in, so
 * HttpTestingController holds each request until the test flushes it.
 * `host` stands in for the API base the real SCMs derive from the endpoint
 * or the public API URL.
 */
function makeHttpScm(endpointGuid: string, host = 'https://api.github.com'): GitSCM {
  return makeScm({
    endpointGuid,
    getPublicApi: () => host,
    getRepository: (http: HttpClient, p: string) => http.get<GitRepo>(`${host}/${endpointGuid}/repos/${p}`),
    getBranch: (http: HttpClient, p: string, b: string) =>
      http.get<GitBranch>(`${host}/${endpointGuid}/repos/${p}/branches/${b}`),
    getCommit: (http: HttpClient, p: string, sha: string) =>
      http.get<GitCommit>(`${host}/${endpointGuid}/repos/${p}/commits/${sha}`),
  });
}

const notFound = { status: 404, statusText: 'Not Found' };

describe('GitDataService', () => {
  let service: GitDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        GitDataService,
      ],
    });
    service = TestBed.inject(GitDataService);
  });

  describe('getRepository', () => {
    it('fetches via scm.getRepository and exposes the post-processed repo', async () => {
      const scm = makeScm();
      const res = service.getRepository(scm, 'org/repo');
      const repo = await firstValueFrom(res.waitForValue$);

      expect(repo.full_name).toBe('org/repo');
      // post-processing parity with the old GitEffects fetchRep$
      expect(repo.scmType).toBe('github');
      expect(repo.projectName).toBe('org/repo');
      expect(repo.endpointGuid).toBe('ep-1');
      expect(repo.guid).toBe('github--org/repo');
      expect(res.value()).toEqual(repo);
      expect(res.fetching()).toBe(false);
      expect(res.error()).toBe(false);
    });

    it('caches by guid — repeated calls for the same project fetch once', () => {
      const getRepository = vi.fn(() => of({ full_name: 'org/repo' } as GitRepo));
      const scm = makeScm({ getRepository });

      service.getRepository(scm, 'org/repo');
      service.getRepository(scm, 'org/repo');

      expect(getRepository).toHaveBeenCalledTimes(1);
    });

    it('surfaces errors on the error/errorMessage signals and leaves value null', async () => {
      const scm = makeScm({
        getRepository: () => throwError(() => new Error('boom')) as Observable<GitRepo>,
      });
      const res = service.getRepository(scm, 'org/repo');
      // state$ mirrors the request lifecycle; wait until it settles on the error
      const state = await firstValueFrom(res.state$.pipe(filter(s => s.error), take(1)));

      expect(state.error).toBe(true);
      expect(state.errorMessage).toBe('boom');
      expect(res.value()).toBeNull();
      expect(res.fetching()).toBe(false);
    });
  });

  describe('getBranches', () => {
    it('fetches the list and post-processes each branch', async () => {
      const scm = makeScm();
      const branches = await firstValueFrom(service.getBranches(scm, 'org/repo'));

      expect(branches.map(b => b.name)).toEqual(['main', 'dev']);
      expect(branches[0].scmType).toBe('github');
      expect(branches[0].projectName).toBe('org/repo');
      expect(branches[0].endpointGuid).toBe('ep-1');
      expect(branches[0].guid).toBe('github--org/repo--main');
    });
  });

  describe('getBranch', () => {
    it('fetches a single branch and post-processes it', async () => {
      const scm = makeScm();
      const branch = await firstValueFrom(service.getBranch(scm, 'org/repo', 'main').waitForValue$);

      expect(branch.name).toBe('main');
      // strict: the makeScm fake always returns a branch with a commit.
      expect(branch.commit!.sha).toBe('abc');
      expect(branch.projectName).toBe('org/repo');
      expect(branch.guid).toBe('github--org/repo--main');
    });
  });

  describe('getCommit', () => {
    it('fetches a single commit and post-processes it', async () => {
      const scm = makeScm();
      const res = service.getCommit(scm, 'org/repo', 'abc');
      const commit = await firstValueFrom(res.waitForValue$);

      expect(commit.sha).toBe('abc');
      expect(commit.scmType).toBe('github');
      expect(commit.projectName).toBe('org/repo');
      expect(commit.endpointGuid).toBe('ep-1');
      expect(commit.guid).toBe('github--org/repo--abc');
    });
  });

  describe('with requests held by the HTTP testing backend', () => {
    let httpMock: HttpTestingController;

    beforeEach(() => {
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    // A failed lookup must not stay cached: the next read retries instead of
    // showing the failure until the page reloads.
    it('retries a repository lookup that failed when it is read again', async () => {
      const scm = makeHttpScm('ep-1');
      const first = service.getRepository(scm, 'org/repo');
      httpMock.expectOne('https://api.github.com/ep-1/repos/org/repo').flush('nope', notFound);
      await firstValueFrom(first.state$.pipe(filter(s => s.error)));

      const second = service.getRepository(scm, 'org/repo');
      httpMock.expectOne('https://api.github.com/ep-1/repos/org/repo')
        .flush({ full_name: 'org/repo', clone_url: 'url', default_branch: 'main' });

      expect((await firstValueFrom(second.waitForValue$)).full_name).toBe('org/repo');
      expect(second.error()).toBe(false);
    });

    it('retries a commit lookup that failed when it is read again', async () => {
      const scm = makeHttpScm('ep-1');
      const first = service.getCommit(scm, 'org/repo', 'abc');
      httpMock.expectOne('https://api.github.com/ep-1/repos/org/repo/commits/abc').flush('nope', notFound);
      await firstValueFrom(first.state$.pipe(filter(s => s.error)));

      service.getCommit(scm, 'org/repo', 'abc');
      httpMock.expectOne('https://api.github.com/ep-1/repos/org/repo/commits/abc').flush({ sha: 'abc' });
    });

    // A branch's head moves on every push. A plain read shares the cached
    // entry; a refresh read (the gitscm tab opening) fetches the head again.
    it('refetches a branch on a refresh read and exposes the new head', async () => {
      const scm = makeHttpScm('ep-1');
      const url = 'https://api.github.com/ep-1/repos/org/repo/branches/main';
      const first = service.getBranch(scm, 'org/repo', 'main');
      httpMock.expectOne(url).flush({ name: 'main', commit: { sha: 'abc' } });
      expect((await firstValueFrom(first.waitForValue$)).commit!.sha).toBe('abc');

      service.getBranch(scm, 'org/repo', 'main');
      httpMock.expectNone(url);

      const refreshed = service.getBranch(scm, 'org/repo', 'main', { refresh: true });
      httpMock.expectOne(url).flush({ name: 'main', commit: { sha: 'def' } });

      expect((await firstValueFrom(refreshed.waitForValue$)).commit!.sha).toBe('def');
      // Later plain reads see the refreshed entry.
      expect(service.getBranch(scm, 'org/repo', 'main').value()!.commit!.sha).toBe('def');
    });

    it('shares a branch request still in flight with a refresh read', () => {
      const scm = makeHttpScm('ep-1');
      const url = 'https://api.github.com/ep-1/repos/org/repo/branches/main';
      const first = service.getBranch(scm, 'org/repo', 'main');
      const refreshed = service.getBranch(scm, 'org/repo', 'main', { refresh: true });

      expect(refreshed).toBe(first);
      httpMock.expectOne(url).flush({ name: 'main', commit: { sha: 'abc' } });
    });

    // waitForValue$ is what the deploy wizard and the gitscm tab wait on. It
    // must end: error when the lookup fails, complete after the value.
    it('waitForValue$ errors with the message when the lookup fails', async () => {
      const scm = makeHttpScm('ep-1');
      const res = service.getCommit(scm, 'org/repo', 'abc');
      const outcome = firstValueFrom(res.waitForValue$).then(
        () => 'value',
        (err: Error) => `error: ${err.message}`,
      );
      httpMock.expectOne('https://api.github.com/ep-1/repos/org/repo/commits/abc').flush('nope', notFound);

      const result = await Promise.race([
        outcome,
        new Promise(resolve => setTimeout(() => resolve('still waiting'), 50)),
      ]);
      expect(result).toMatch(/^error: /);
    });

    it('waitForValue$ completes after the value', async () => {
      const scm = makeHttpScm('ep-1');
      const res = service.getRepository(scm, 'org/repo');
      const events: string[] = [];
      const done = new Promise<void>(resolve => {
        res.waitForValue$.subscribe({
          next: () => events.push('next'),
          complete: () => {
            events.push('complete');
            resolve();
          },
        });
      });
      httpMock.expectOne('https://api.github.com/ep-1/repos/org/repo').flush({ full_name: 'org/repo' });

      await Promise.race([done, new Promise(resolve => setTimeout(resolve, 50))]);
      expect(events).toEqual(['next', 'complete']);
    });

    // github.com and a GitHub Enterprise host (or two GitLab hosts) can both
    // hold `org/repo`; their entries must not be shared.
    it('keeps the same owner/repo on two endpoints apart', async () => {
      const a = service.getRepository(makeHttpScm('ep-a'), 'org/repo');
      const b = service.getRepository(makeHttpScm('ep-b'), 'org/repo');

      expect(b).not.toBe(a);
      httpMock.expectOne('https://api.github.com/ep-a/repos/org/repo').flush({ full_name: 'org/repo', html_url: 'a' });
      httpMock.expectOne('https://api.github.com/ep-b/repos/org/repo').flush({ full_name: 'org/repo', html_url: 'b' });
      expect((await firstValueFrom(a.waitForValue$)).html_url).toBe('a');
      expect((await firstValueFrom(b.waitForValue$)).html_url).toBe('b');
    });

    it('keeps the same owner/repo on two hosts with no endpoint apart', () => {
      const ghe = 'https://github.example.com/api/v3';
      service.getBranch(makeHttpScm('', 'https://api.github.com'), 'org/repo', 'main');
      service.getBranch(makeHttpScm('', ghe), 'org/repo', 'main');
      service.getCommit(makeHttpScm('', 'https://api.github.com'), 'org/repo', 'abc');
      service.getCommit(makeHttpScm('', ghe), 'org/repo', 'abc');

      httpMock.expectOne('https://api.github.com//repos/org/repo/branches/main').flush({ name: 'main' });
      httpMock.expectOne(`${ghe}//repos/org/repo/branches/main`).flush({ name: 'main' });
      httpMock.expectOne('https://api.github.com//repos/org/repo/commits/abc').flush({ sha: 'abc' });
      httpMock.expectOne(`${ghe}//repos/org/repo/commits/abc`).flush({ sha: 'abc' });
    });
  });
});
