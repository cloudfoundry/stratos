import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, Signal, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { getCommitGuid, getRepositoryGuid } from '../store/git-entity-factory';
import { GitBranch, GitCommit, GitRepo } from '../store/git.public-types';
import { GitSCM } from './scm/scm';

/**
 * Reactive state for a single on-demand git resource (repo / branch / commit).
 * Replaces the EntityInfo / EntityMonitor surface the components used to read
 * from the ngrx entity store (`entityObs$`, `waitForEntity$`,
 * `entityMonitor.entityRequest$`).
 */
export interface GitResourceState<T> {
  value: T | null;
  fetching: boolean;
  error: boolean;
  errorMessage: string;
}

export interface GitResource<T> {
  readonly value: Signal<T | null>;
  readonly fetching: Signal<boolean>;
  readonly error: Signal<boolean>;
  readonly errorMessage: Signal<string>;
  /** Continuous state stream — equivalent to the old `entityObs$`. */
  readonly state$: Observable<GitResourceState<T>>;
  /** Emits once the value is available — equivalent to the old `waitForEntity$`. */
  readonly waitForValue$: Observable<T>;
}

/**
 * Signal-native replacement for the git ngrx entity pipeline (GitEffects +
 * git actions + the `gitEntityCatalog.*.store` action-orchestrator surface).
 *
 * The actual HTTP has always lived on the `GitSCM` instances
 * (`getRepository` / `getBranch(es)` / `getCommit(s)`); GitEffects only funnelled
 * those observables through the store. This service calls the SCM methods
 * directly, applies the same post-processing the effect did (stamping
 * `scmType` / `projectName` / `guid` / `endpointGuid` onto each entity), and
 * holds the result in per-resource signals cached by guid so repeated reads of
 * the same resource share a single fetch (mirroring the entity-store dedupe).
 */
@Injectable({ providedIn: 'root' })
export class GitDataService {
  private http = inject(HttpClient);
  private injector = inject(Injector);

  private repos = new Map<string, GitResource<GitRepo>>();
  private branches = new Map<string, GitResource<GitBranch>>();
  private commits = new Map<string, GitResource<GitCommit>>();

  getRepository(scm: GitSCM, projectName: string): GitResource<GitRepo> {
    const guid = getRepositoryGuid(scm.getType(), projectName);
    return this.resource(this.repos, guid, scm, () =>
      scm.getRepository(this.http, projectName).pipe(
        map(repo => this.stampRepo(repo, scm, projectName, guid))
      )
    );
  }

  getBranch(scm: GitSCM, projectName: string, branchName: string): GitResource<GitBranch> {
    const guid = getCommitGuid(scm.getType(), projectName, branchName);
    return this.resource(this.branches, guid, scm, () =>
      scm.getBranch(this.http, projectName, branchName).pipe(
        map(branch => this.stampBranch(branch, scm, projectName))
      )
    );
  }

  getCommit(scm: GitSCM, projectName: string, commitSha: string): GitResource<GitCommit> {
    const guid = getCommitGuid(scm.getType(), projectName, commitSha);
    return this.resource(this.commits, guid, scm, () =>
      scm.getCommit(this.http, projectName, commitSha).pipe(
        map(commit => this.stampCommit(commit, scm, projectName))
      )
    );
  }

  /**
   * The branch list for a project. Not cached — the deploy wizard re-derives it
   * each time the project name changes, matching the old pagination service's
   * per-project fetch.
   */
  getBranches(scm: GitSCM, projectName: string): Observable<GitBranch[]> {
    return scm.getBranches(this.http, projectName).pipe(
      map(branches => branches.map(b => this.stampBranch(b, scm, projectName)))
    );
  }

  private resource<T>(
    cache: Map<string, GitResource<T>>,
    guid: string,
    scm: GitSCM,
    fetch: () => Observable<T>
  ): GitResource<T> {
    const existing = cache.get(guid);
    if (existing) {
      return existing;
    }

    const state = signal<GitResourceState<T>>({
      value: null,
      fetching: true,
      error: false,
      errorMessage: '',
    });
    const state$ = toObservable(state, { injector: this.injector });

    const resource: GitResource<T> = {
      value: computed(() => state().value),
      fetching: computed(() => state().fetching),
      error: computed(() => state().error),
      errorMessage: computed(() => state().errorMessage),
      state$,
      waitForValue$: state$.pipe(
        filter(s => s.value !== null),
        map(s => s.value as T)
      ),
    };
    cache.set(guid, resource);

    fetch().subscribe({
      next: value => state.set({ value, fetching: false, error: false, errorMessage: '' }),
      error: err => state.set({
        value: null,
        fetching: false,
        error: true,
        errorMessage: scm.parseErrorAsString(err),
      }),
    });

    return resource;
  }

  private stampRepo(repo: GitRepo, scm: GitSCM, projectName: string, guid: string): GitRepo {
    repo.scmType = scm.getType();
    repo.projectName = projectName;
    repo.guid = guid;
    repo.endpointGuid = scm.endpointGuid;
    return repo;
  }

  private stampBranch(branch: GitBranch, scm: GitSCM, projectName: string): GitBranch {
    branch.scmType = scm.getType();
    branch.projectName = projectName;
    branch.guid = getCommitGuid(scm.getType(), projectName, branch.name);
    branch.endpointGuid = scm.endpointGuid;
    return branch;
  }

  private stampCommit(commit: GitCommit, scm: GitSCM, projectName: string): GitCommit {
    const stamped: GitCommit = {
      ...commit,
      scmType: scm.getType(),
      projectName,
      endpointGuid: scm.endpointGuid,
    };
    stamped.guid = getCommitGuid(scm.getType(), projectName, stamped.sha);
    return stamped;
  }
}
