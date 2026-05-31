import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GitCommit } from '../../../../../store/git.public-types';
import { GitSCM } from '../../../../scm/scm';
import { GithubCommitsSignalConfigService } from './github-commits-signal-config.service';

const commit = (sha: string, message: string, name: string, date: string): GitCommit => ({
  sha,
  html_url: `https://example.com/${sha}`,
  projectName: 'org/repo',
  commit: { message, author: { name, date, email: `${name}@x.io` } },
});

const COMMITS: GitCommit[] = [
  commit('aaa1111', 'zebra fix', 'Bob', '2024-03-01T00:00:00Z'),
  commit('bbb2222', 'apple fix', 'Alice', '2024-03-03T00:00:00Z'),
  commit('ccc3333', 'mango fix', 'Carol', '2024-03-02T00:00:00Z'),
];

function fakeScm(commits: GitCommit[] = COMMITS): GitSCM {
  return { getCommits: vi.fn().mockReturnValue(of(commits)) } as unknown as GitSCM;
}

describe('GithubCommitsSignalConfigService', () => {
  let svc: GithubCommitsSignalConfigService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        GithubCommitsSignalConfigService,
      ],
    });
    svc = TestBed.inject(GithubCommitsSignalConfigService);
  });

  it('exposes core signals', () => {
    expect(svc.sort).toBeDefined();
    expect(svc.pageSize).toBeDefined();
    expect(svc.pageIndex).toBeDefined();
    expect(svc.selectedKey).toBeDefined();
  });

  it('initialize builds an empty view pipeline', () => {
    svc.initialize(fakeScm(), 'org/repo', 'main');
    expect(svc.view).toBeDefined();
    expect(svc.view.pagedItems()).toEqual([]);
  });

  it('loadAll fetches commits and defaults to newest-first (date desc)', async () => {
    const scm = fakeScm();
    svc.initialize(scm, 'org/repo', 'main');
    await svc.loadAll();

    expect(scm.getCommits).toHaveBeenCalledWith(expect.anything(), 'org/repo', 'main');
    expect(svc.view.pagedItems().map(c => c.sha)).toEqual(['bbb2222', 'ccc3333', 'aaa1111']);
    expect(svc.view.totalFilteredResults()).toBe(3);
  });

  it('sorts by message with natural ordering', async () => {
    svc.initialize(fakeScm(), 'org/repo', 'main');
    await svc.loadAll();

    svc.sort.set({ field: 'message', direction: 'asc' });
    expect(svc.view.pagedItems().map(c => c.commit!.message)).toEqual([
      'apple fix',
      'mango fix',
      'zebra fix',
    ]);
  });

  it('getRowKey is the sha', () => {
    expect(svc.getRowKey(COMMITS[0])).toBe('aaa1111');
  });

  it('selectFirst picks the first commit in current order', async () => {
    svc.initialize(fakeScm(), 'org/repo', 'main');
    await svc.loadAll();
    svc.selectFirst();
    expect(svc.selectedKey()).toBe('bbb2222');
    expect(svc.selectedCommit()?.sha).toBe('bbb2222');
  });

  it('highlights the deployed commit passed to initialize', async () => {
    svc.initialize(fakeScm(), 'org/repo', 'main', 'ccc3333');
    await svc.loadAll();
    expect(svc.isHighlighted(COMMITS[2])).toBe(true);
    expect(svc.isHighlighted(COMMITS[0])).toBe(false);
  });

  it('selectedCommit is undefined until something is selected', async () => {
    svc.initialize(fakeScm(), 'org/repo', 'main');
    await svc.loadAll();
    expect(svc.selectedCommit()).toBeUndefined();
  });
});
