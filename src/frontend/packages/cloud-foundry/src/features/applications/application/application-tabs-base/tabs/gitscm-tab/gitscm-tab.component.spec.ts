import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { CommonModule } from '@angular/common';
import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { TailwindSnackBarService } from '@stratosui/core';
import { EMPTY, Observable, of } from 'rxjs';

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
    const notFound = { status: 404, statusText: 'Not Found' };
    let httpMock: HttpTestingController;
    let error: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      await configure(of(project), project);
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

    it('reports a failed repository lookup once', async () => {
      httpMock.expectOne(repoUrl).flush('nope', notFound);
      await fixture.whenStable();

      // The error report reads the lookup it already holds, not a new one.
      httpMock.expectNone(repoUrl);
      expect(error).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledWith('Unable to fetch GitHub project: Git request failed(404)');
    });
  });
});
