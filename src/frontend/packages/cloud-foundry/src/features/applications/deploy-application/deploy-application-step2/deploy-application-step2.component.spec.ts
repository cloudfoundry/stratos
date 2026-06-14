import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject, of } from 'rxjs';

import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService, GitHubSCM } from '@stratosui/git';
import {
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../cf-entity-generator';
import { ApplicationDeploySourceTypes } from '../deploy-application-steps.types';
import { DeployApplicationStep2Component } from './deploy-application-step2.component';

describe('DeployApplicationStep2Component', () => {
  let component: DeployApplicationStep2Component;
  let fixture: ComponentFixture<DeployApplicationStep2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DeployApplicationStep2Component,
        createBasicStoreModule(),
        EntityCatalogTestModule,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ],
        },
        GitSCMService,
        ApplicationDeploySourceTypes,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {}, data: {}, params: {} } },
        },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  it('should be defined', () => {
    expect(DeployApplicationStep2Component).toBeDefined();
  });

  it('creates the component', () => {
    fixture = TestBed.createComponent(DeployApplicationStep2Component);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  describe('applyGithubEnterpriseAndToken (GHE + PAT port)', () => {
    let scmSpy: {
      setPublicApi: ReturnType<typeof vi.fn>;
      setAccessToken: ReturnType<typeof vi.fn>;
      clearAccessToken: ReturnType<typeof vi.fn>;
      getType: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      fixture = TestBed.createComponent(DeployApplicationStep2Component);
      component = fixture.componentInstance;

      scmSpy = {
        setPublicApi: vi.fn(),
        setAccessToken: vi.fn(),
        clearAccessToken: vi.fn(),
        getType: vi.fn().mockReturnValue('github'),
      };
      // Inject a mock SCM so applyGithubEnterpriseAndToken's side effects are observable
      // without driving the full deploy-step form.
      component.scm = scmSpy as unknown as GitHubSCM;
    });

    const invoke = (url: string | undefined, token: string | undefined) =>
      (component as unknown as {
        applyGithubEnterpriseAndToken(u?: string, t?: string): void;
      }).applyGithubEnterpriseAndToken(url, token);

    it('flags an invalid enterprise URL and does not set the public API', () => {
      invoke('not-a-url', undefined);

      expect(component.isInvalidGithubEnterpriseUrl).toBe(true);
      expect(scmSpy.setPublicApi).not.toHaveBeenCalled();
    });

    it('sets the public API endpoint for a valid enterprise URL', () => {
      invoke('https://github.example.com/api/v3', undefined);

      expect(component.isInvalidGithubEnterpriseUrl).toBe(false);
      expect(scmSpy.setPublicApi).toHaveBeenCalledWith('https://github.example.com/api/v3');
    });

    it('sets the access token when one is provided', () => {
      invoke('https://github.example.com/api/v3', 'pat-abc123');

      expect(scmSpy.setAccessToken).toHaveBeenCalledWith('pat-abc123');
      expect(scmSpy.clearAccessToken).not.toHaveBeenCalled();
    });

    it('clears the access token when none is provided', () => {
      invoke('https://github.example.com/api/v3', '');

      expect(scmSpy.clearAccessToken).toHaveBeenCalled();
      expect(scmSpy.setAccessToken).not.toHaveBeenCalled();
    });

    it('ignores an empty enterprise URL and leaves the public API untouched', () => {
      invoke('', 'pat-abc123');

      expect(component.isInvalidGithubEnterpriseUrl).toBe(false);
      expect(scmSpy.setPublicApi).not.toHaveBeenCalled();
    });

    it('skips token handling when the active SCM is not GitHub (e.g. GitLab)', () => {
      scmSpy.getType.mockReturnValue('gitlab');
      invoke('https://gitlab.example.com/api/v4', 'pat-should-be-ignored');

      expect(scmSpy.setAccessToken).not.toHaveBeenCalled();
      expect(scmSpy.clearAccessToken).not.toHaveBeenCalled();
    });

  });

  describe('git access mode (Public / Private / Enterprise tabs)', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(DeployApplicationStep2Component);
      component = fixture.componentInstance;
    });

    it('derives Enterprise when a base URL is present', () => {
      expect(DeployApplicationStep2Component.deriveGitMode('https://github.corp.com', 'tok')).toBe('enterprise');
      // URL alone (token still to be entered) is still Enterprise.
      expect(DeployApplicationStep2Component.deriveGitMode('https://github.corp.com', '')).toBe('enterprise');
    });

    it('derives Private when a token is present but no base URL', () => {
      expect(DeployApplicationStep2Component.deriveGitMode('', 'tok')).toBe('private');
      expect(DeployApplicationStep2Component.deriveGitMode(undefined, 'tok')).toBe('private');
    });

    it('derives Public when neither a base URL nor a token is present', () => {
      expect(DeployApplicationStep2Component.deriveGitMode('', '')).toBe('public');
      expect(DeployApplicationStep2Component.deriveGitMode(undefined, undefined)).toBe('public');
    });

    it('switching to Public clears both the base URL and the token', () => {
      component.githubEnterpriseUrl = 'https://github.corp.com';
      component.accessToken = 'tok';
      component.setGitMode('public');
      expect(component.gitMode).toBe('public');
      expect(component.githubEnterpriseUrl).toBe('');
      expect(component.accessToken).toBe('');
    });

    it('switching to Private clears the base URL but keeps the token', () => {
      component.githubEnterpriseUrl = 'https://github.corp.com';
      component.accessToken = 'tok';
      component.setGitMode('private');
      expect(component.gitMode).toBe('private');
      expect(component.githubEnterpriseUrl).toBe('');
      expect(component.accessToken).toBe('tok');
    });

    it('switching to Enterprise keeps both the base URL and the token', () => {
      component.githubEnterpriseUrl = 'https://github.corp.com';
      component.accessToken = 'tok';
      component.setGitMode('enterprise');
      expect(component.gitMode).toBe('enterprise');
      expect(component.githubEnterpriseUrl).toBe('https://github.corp.com');
      expect(component.accessToken).toBe('tok');
    });
  });

  describe('applyGithubEnterpriseAndToken — form wiring', () => {
    let scmSpy: {
      setPublicApi: ReturnType<typeof vi.fn>;
      setAccessToken: ReturnType<typeof vi.fn>;
      clearAccessToken: ReturnType<typeof vi.fn>;
      getType: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      fixture = TestBed.createComponent(DeployApplicationStep2Component);
      component = fixture.componentInstance;
      scmSpy = {
        setPublicApi: vi.fn(),
        setAccessToken: vi.fn(),
        clearAccessToken: vi.fn(),
        getType: vi.fn().mockReturnValue('github'),
      };
      component.scm = scmSpy as unknown as GitHubSCM;
    });

    it('wires applyGithubEnterpriseAndToken to the sourceSelectionForm valueChanges stream', () => {
      // Mock the NgForm ViewChild with a Subject so we can emit form values
      // without standing up the full template-driven reactive form. Also mock
      // setupForGit's other upstream collaborators just enough to reach the
      // suggestedRepos$ assignment where the tap callback is registered.
      const valueChanges = new Subject<Record<string, string | undefined>>();
      (component as unknown as {
        sourceSelectionForm: { valueChanges: Subject<Record<string, string | undefined>> };
      }).sourceSelectionForm = {
        valueChanges,
      };
      // updateSuggestedRepositories is called inside switchMap; stub it to
      // return an empty result so the pipe completes without network work.
      vi.spyOn(
        component as unknown as { updateSuggestedRepositories: (n: string) => unknown },
        'updateSuggestedRepositories',
      ).mockReturnValue(of([]));

      // Invoke setupForGit so the valueChanges subscription gets wired up.
      (component as unknown as { setupForGit(): void }).setupForGit();
      // Subscribe to keep the pipe hot; the tap callback only fires on
      // subscribed observables.
      component.suggestedRepos$.subscribe();

      valueChanges.next({
        githubEnterpriseUrl: 'https://github.example.com/api/v3',
        githubAccessToken: 'pat-from-form',
        projectName: 'org/repo',
      });

      expect(scmSpy.setPublicApi).toHaveBeenCalledWith('https://github.example.com/api/v3');
      expect(scmSpy.setAccessToken).toHaveBeenCalledWith('pat-from-form');
    });
  });
});
