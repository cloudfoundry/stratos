import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { CommonModule } from '@angular/common';
import { getGitHubAPIURL, GITHUB_API_URL, GitDataService, GitResource, GitSCMService } from '@stratosui/git';
import { TailwindSnackBarService } from '@stratosui/core';
import { defer, EMPTY, Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { TruncatePipe } from '../../../../../../../../core/src/core/truncate.pipe';
import { AppDetailDataService } from '../../../../../../features/applications/app-detail-data.service';
import { CfDeployAppDataService } from '../../../../../../services/domain-data/cf-deploy-app-data.service';
import { ApplicationService } from '../../../../application.service';
import { GitSCMTabComponent } from './gitscm-tab.component';

const project = {
  deploySource: {
    type: 'gitscm',
    scm: 'github',
    project: 'org/repo',
    branch: 'main',
    commit: 'abc',
    endpointGuid: '',
    timestamp: 0,
  },
};

/**
 * Minimal AppDetailDataService stub. Used only for `data.stratosProject()`
 * reads from the template; ngOnInit branches on ApplicationService instead.
 */
const makeDataStub = (stratosProject: unknown) => ({
  stratosProject: signal<any>(stratosProject).asReadonly(),
});

/**
 * Minimal ApplicationService stub. EMPTY suppresses the inner subscribe
 * body so ngOnInit doesn't reach into the git data service.
 */
const makeAppServiceStub = (applicationStratProject$: Observable<unknown>) => ({
  applicationStratProject$,
  waitForAppEntity$: EMPTY,
  appSpace$: EMPTY,
});

function configure(applicationStratProject$: Observable<unknown>, stratosProject: unknown) {
  return TestBed.configureTestingModule({
    imports: [
      GitSCMTabComponent,
    ],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      provideNoopAnimations(),
      TailwindSnackBarService,
      { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
      DatePipe,
      GitSCMService,
      { provide: AppDetailDataService, useFactory: () => makeDataStub(stratosProject) },
      { provide: ApplicationService, useFactory: () => makeAppServiceStub(applicationStratProject$) },
      { provide: CfDeployAppDataService, useValue: {} },
    ],
    schemas: [NO_ERRORS_SCHEMA]
  })
  // Keep CommonModule (async pipe) and the template's pipe but strip deep
  // child components that pull in the full ngrx entity store.
  .overrideComponent(GitSCMTabComponent, {
    set: { imports: [CommonModule, TruncatePipe] },
  })
  .compileComponents();
}

describe('GitSCMTabComponent', () => {
  let component: GitSCMTabComponent;
  let fixture: ComponentFixture<GitSCMTabComponent>;

  describe('without a deployed project', () => {
    beforeEach(async () => {
      await configure(EMPTY, null);
      fixture = TestBed.createComponent(GitSCMTabComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  // A deployed project's git lookups, held by the HTTP testing backend.
  describe('git lookups', () => {
    const repoUrl = 'https://api.github.com/repos/org/repo';
    const commitUrl = 'https://api.github.com/repos/org/repo/commits/abc';
    const branchUrl = 'https://api.github.com/repos/org/repo/branches/main';
    const notFound = { status: 404, statusText: 'Not Found' };
    let httpMock: HttpTestingController;
    let error: ReturnType<typeof vi.spyOn>;

    // Every git lookup subscription the tab opens must end: on the lookup's
    // value, on its error, or when the tab is destroyed. Each resource the
    // tab reads is wrapped to count the subscriptions still open on it.
    let open: Record<'repo' | 'commit' | 'branch', number>;
    const counted = <T>(kind: keyof typeof open, source: Observable<T>) => defer(() => {
      open[kind]++;
      return source.pipe(finalize(() => open[kind]--));
    });
    const track = <T>(kind: keyof typeof open, resource: GitResource<T>): GitResource<T> => ({
      ...resource,
      state$: counted(kind, resource.state$),
      waitForValue$: counted(kind, resource.waitForValue$),
    });

    beforeEach(async () => {
      await configure(of(project), project);
      open = { repo: 0, commit: 0, branch: 0 };
      const gitData = TestBed.inject(GitDataService);
      const getRepository = gitData.getRepository.bind(gitData);
      const getCommit = gitData.getCommit.bind(gitData);
      const getBranch = gitData.getBranch.bind(gitData);
      vi.spyOn(gitData, 'getRepository').mockImplementation((...a) => track('repo', getRepository(...a)));
      vi.spyOn(gitData, 'getCommit').mockImplementation((...a) => track('commit', getCommit(...a)));
      vi.spyOn(gitData, 'getBranch').mockImplementation((...a) => track('branch', getBranch(...a)));
      error = vi.spyOn(TestBed.inject(TailwindSnackBarService), 'error');
      httpMock = TestBed.inject(HttpTestingController);

      fixture = TestBed.createComponent(GitSCMTabComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    afterEach(() => {
      // The commit list loads its own pages once the repo resolves.
      httpMock.match(() => true);
    });

    it('ends the commit subscriptions when the commit lookup fails', async () => {
      httpMock.expectOne(repoUrl).flush({ full_name: 'org/repo', html_url: 'h', owner: {} });
      await fixture.whenStable();
      httpMock.expectOne(commitUrl).flush('nope', notFound);
      httpMock.expectOne(branchUrl).flush({ name: 'main', commit: { sha: 'abc' } });
      await fixture.whenStable();

      expect(open.commit).toBe(0);

      fixture.destroy();
      expect(open).toEqual({ repo: 0, commit: 0, branch: 0 });
    });

    it('reports a failed repository lookup once and ends its subscriptions', async () => {
      httpMock.expectOne(repoUrl).flush('nope', notFound);
      await fixture.whenStable();

      // The error report reads the lookup it already holds, not a new one.
      httpMock.expectNone(repoUrl);
      expect(error).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledWith('Unable to fetch GitHub project: Git request failed(404)');

      fixture.destroy();
      expect(open).toEqual({ repo: 0, commit: 0, branch: 0 });
    });

    // The branch head moves with every push, so opening the tab reads it
    // afresh instead of reusing what an earlier visit cached.
    it('reads the branch head afresh each time the tab opens', async () => {
      httpMock.expectOne(repoUrl).flush({ full_name: 'org/repo', html_url: 'h', owner: {} });
      await fixture.whenStable();
      httpMock.expectOne(commitUrl).flush({ sha: 'abc', commit: { author: { date: '2026-01-01' } } });
      httpMock.expectOne(branchUrl).flush({ name: 'main', commit: { sha: 'abc' } });
      await fixture.whenStable();
      fixture.destroy();

      fixture = TestBed.createComponent(GitSCMTabComponent);
      await fixture.whenStable();
      httpMock.expectNone(repoUrl);
      httpMock.expectOne(branchUrl).flush({ name: 'main', commit: { sha: 'def' } });
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('branch has been updated since this app was deployed');
    });
  });
});
