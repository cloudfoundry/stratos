import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { naturalCompare, SignalListSort } from '@stratosui/core';

import { GitCommit } from '../../../../../store/git.public-types';
import { GitSCM } from '../../../../scm/scm';

type SortValue = string | number;

// Per-package signal view pipeline for the commit list: sort then client-side
// page. Mirrors the KubeViewPipeline shape used elsewhere; string extractors
// sort with naturalCompare (parity with the legacy `natural-sort` columns),
// numeric extractors (dates as epoch millis) sort numerically.
class GitCommitsViewPipeline {
  readonly sortedItems: Signal<GitCommit[]>;
  readonly pagedItems: Signal<GitCommit[]>;
  readonly totalFilteredResults: Signal<number>;
  readonly totalPages: Signal<number>;

  constructor(
    items: Signal<GitCommit[]>,
    sort: Signal<SignalListSort>,
    pageSize: Signal<number>,
    pageIndex: Signal<number>,
    extractors: Signal<Map<string, (row: GitCommit) => SortValue>>,
  ) {
    this.sortedItems = computed(() => {
      const spec = sort();
      const extractor = extractors().get(spec.field);
      if (!extractor) {
        return items();
      }
      const sign = spec.direction === 'asc' ? 1 : -1;
      return [...items()].sort((a, b) => {
        const av = extractor(a);
        const bv = extractor(b);
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * sign;
        }
        return naturalCompare(String(av), String(bv), false, spec.direction);
      });
    });
    this.pagedItems = computed(() => {
      const size = pageSize();
      const idx = pageIndex();
      return this.sortedItems().slice(idx * size, idx * size + size);
    });
    this.totalFilteredResults = computed(() => items().length);
    this.totalPages = computed(() => {
      const n = this.totalFilteredResults();
      const size = pageSize();
      return size > 0 ? Math.max(1, Math.ceil(n / size)) : 1;
    });
  }
}

// Signal-native replacement for GithubCommitsDataSource +
// GithubCommitsListConfigServiceBase. Fetches a project's commits straight
// from the SCM (no ngrx pagination), exposes sort/page/selection signals, and
// highlights the deployed commit. Component-provided — it carries per-host
// state (scm / project / ref / deployed sha). Both the app GitSCM tab and the
// deploy-wizard commit picker drive their <app-signal-list> from one instance.
@Injectable()
export class GithubCommitsSignalConfigService {
  private readonly http = inject(HttpClient);

  readonly sort: WritableSignal<SignalListSort> = signal({ field: 'date', direction: 'desc' });
  readonly pageSize: WritableSignal<number> = signal(10);
  readonly pageIndex: WritableSignal<number> = signal(0);

  // Radio single-select (deploy picker). Null when nothing chosen.
  readonly selectedKey: WritableSignal<string | null> = signal(null);

  private readonly _commits: WritableSignal<GitCommit[]> = signal([]);
  private readonly _loading: WritableSignal<boolean> = signal(false);

  private readonly _extractors: WritableSignal<Map<string, (row: GitCommit) => SortValue>> = signal(
    new Map<string, (row: GitCommit) => SortValue>([
      ['message', (c: GitCommit) => c.commit?.message ?? ''],
      ['sha', (c: GitCommit) => c.sha ?? ''],
      ['author', (c: GitCommit) => c.commit?.author?.name ?? ''],
      ['date', (c: GitCommit) => new Date(c.commit?.author?.date ?? 0).getTime()],
    ]),
  );

  private scm!: GitSCM;
  private projectName = '';
  private sha = '';
  private highlightSha?: string;

  view!: GitCommitsViewPipeline;

  getRowKey = (c: GitCommit): string => c.sha;

  // The currently-deployed commit is highlighted in the app GitSCM tab.
  isHighlighted = (c: GitCommit): boolean => !!this.highlightSha && c.sha === this.highlightSha;

  isLoading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  initialize(scm: GitSCM, projectName: string, sha: string, highlightSha?: string): void {
    this.scm = scm;
    this.projectName = projectName;
    this.sha = sha;
    this.highlightSha = highlightSha;
    this.view = new GitCommitsViewPipeline(
      this._commits, this.sort, this.pageSize, this.pageIndex, this._extractors.asReadonly(),
    );
  }

  async loadAll(): Promise<void> {
    this._loading.set(true);
    try {
      const commits = await firstValueFrom(this.scm.getCommits(this.http, this.projectName, this.sha));
      this._commits.set(commits ?? []);
    } finally {
      this._loading.set(false);
    }
  }

  // Auto-select the first commit in the current sort order (the deploy picker
  // pre-selects the newest commit so the step starts valid).
  selectFirst(): void {
    const first = this.view?.sortedItems()[0];
    this.selectedKey.set(first ? this.getRowKey(first) : null);
  }

  selectedCommit(): GitCommit | undefined {
    const key = this.selectedKey();
    if (key == null) {
      return undefined;
    }
    return this._commits().find(c => this.getRowKey(c) === key);
  }
}
