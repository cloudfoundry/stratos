import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
});
