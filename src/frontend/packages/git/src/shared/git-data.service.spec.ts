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
