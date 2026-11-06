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
import { ApplicationDeploySourceTypes, DEPLOY_TYPES_IDS } from '../deploy-application-steps.types';
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

    it('applies the access token for GitLab too, and normalizes the base URL to /api/v4', () => {
      scmSpy.getType.mockReturnValue('gitlab');
      // User types the plain host; we append the GitLab API root before it
      // reaches the SCM.
      invoke('https://workshop.cloud.gov', 'pat-gitlab');

      expect(scmSpy.setPublicApi).toHaveBeenCalledWith('https://workshop.cloud.gov/api/v4');
      expect(scmSpy.setAccessToken).toHaveBeenCalledWith('pat-gitlab');
      expect(scmSpy.clearAccessToken).not.toHaveBeenCalled();
    });

    it('does not double-append /api/v4 when the GitLab base URL already includes it', () => {
      scmSpy.getType.mockReturnValue('gitlab');
      invoke('https://workshop.cloud.gov/api/v4', 'pat-gitlab');

      expect(scmSpy.setPublicApi).toHaveBeenCalledWith('https://workshop.cloud.gov/api/v4');
    });

    it('does not append /api/v4 for a GitHub Enterprise base URL', () => {
      scmSpy.getType.mockReturnValue('github');
      invoke('https://github.example.com/api/v3', 'pat-abc123');

      expect(scmSpy.setPublicApi).toHaveBeenCalledWith('https://github.example.com/api/v3');
    });

    // Token handling used to be gated on the SCM type. It no longer is:
    // setAccessToken/clearAccessToken are part of the GitSCM contract and
    // GitSCMType is exactly 'github' | 'gitlab', so the guard could never be
    // false. A provider added later has to implement the pair to compile.
    it('clears the token for GitLab too when none is provided', () => {
      scmSpy.getType.mockReturnValue('gitlab');
      invoke('https://workshop.cloud.gov', '');

      expect(scmSpy.clearAccessToken).toHaveBeenCalled();
      expect(scmSpy.setAccessToken).not.toHaveBeenCalled();
    });

  });

  describe('scmBaseApiUrl', () => {
    // The getter feeds the project-exists validator's own SCM instance. A
    // half-typed URL must not reach it, or the validator queries a malformed
    // host and reports "not found" for a repository that exists.
    it('is empty while the entered base URL is invalid', () => {
      component.gitMode = 'private';
      component.sourceType = { id: DEPLOY_TYPES_IDS.GITLAB } as any;
      component.githubEnterpriseUrl = 'not a url';
      component.isInvalidGithubEnterpriseUrl = true;

      expect(component.scmBaseApiUrl).toBe('');
    });

    it('normalizes a valid GitLab base URL', () => {
      component.gitMode = 'private';
      component.sourceType = { id: DEPLOY_TYPES_IDS.GITLAB } as any;
      component.githubEnterpriseUrl = 'https://workshop.cloud.gov';
      component.isInvalidGithubEnterpriseUrl = false;

      expect(component.scmBaseApiUrl).toBe('https://workshop.cloud.gov/api/v4');
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

  describe('normalizeGitlabApiUrl', () => {
    const normalize = (u: string) => DeployApplicationStep2Component.normalizeGitlabApiUrl(u);

    it('appends /api/v4 to a plain host', () => {
      expect(normalize('https://workshop.cloud.gov')).toBe('https://workshop.cloud.gov/api/v4');
    });

    it('trims a trailing slash before appending', () => {
      expect(normalize('https://workshop.cloud.gov/')).toBe('https://workshop.cloud.gov/api/v4');
    });

    it('is idempotent when /api/v4 is already present', () => {
      expect(normalize('https://workshop.cloud.gov/api/v4')).toBe('https://workshop.cloud.gov/api/v4');
    });

    it('is idempotent when /api/v4 is present with a trailing slash', () => {
      expect(normalize('https://workshop.cloud.gov/api/v4/')).toBe('https://workshop.cloud.gov/api/v4');
    });
  });

  // Regression guard: a separately-registered github.com endpoint tags the
  // GitHub source type with its guid. In Private/Enterprise mode the user
  // supplies a token directly in the form, so project-exists validation and
  // repo/branch lookups must talk to the SCM API with THAT token, not proxy
  // through the registered endpoint's stored creds (which 404s on a private
  // repo the typed token can actually see). Only Public mode should carry the
  // endpoint guid.
  describe('projectExistsEndpointGuid (private/enterprise must not proxy via registered endpoint)', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(DeployApplicationStep2Component);
      component = fixture.componentInstance;
      // Simulate the GitHub source type carrying a registered endpoint guid.
      component.sourceType = {
        id: 'github',
        group: 'gitscm',
        name: 'GitHub',
        endpointGuid: '747ed39a-endpoint-guid',
      } as any;
    });

    it('uses the registered endpoint guid in Public mode', () => {
      component.gitMode = 'public';
      expect(component.projectExistsEndpointGuid).toBe('747ed39a-endpoint-guid');
    });

    it('drops the endpoint guid in Private mode (use the typed token directly)', () => {
      component.gitMode = 'private';
      expect(component.projectExistsEndpointGuid).toBe('');
    });

    it('drops the endpoint guid in Enterprise mode (use the typed token directly)', () => {
      component.gitMode = 'enterprise';
      expect(component.projectExistsEndpointGuid).toBe('');
    });

    it('rebuilds the SCM with no endpoint guid when switching to Private', () => {
      const getSCM = vi.spyOn(TestBed.inject(GitSCMService), 'getSCM');
      component.setGitMode('private');
      // Last getSCM call should target the github type with an empty guid so
      // the SCM talks to the API directly with the form token.
      expect(getSCM).toHaveBeenLastCalledWith('github', '');
    });

    it('rebuilds the SCM with the endpoint guid when switching to Public', () => {
      const getSCM = vi.spyOn(TestBed.inject(GitSCMService), 'getSCM');
      component.setGitMode('public');
      expect(getSCM).toHaveBeenLastCalledWith('github', '747ed39a-endpoint-guid');
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
