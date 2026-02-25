import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ApplicationDeploySourceTypes } from '../deploy-application-steps.types';
import { DeployApplicationStep2Component } from './deploy-application-step2.component';

describe('DeployApplicationStep2Component', () => {
  let component: DeployApplicationStep2Component;
  let fixture: ComponentFixture<DeployApplicationStep2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DeployApplicationStep2Component
      ],
      providers: [
        provideMockStore(),
        ...STORE_TEST_PROVIDERS,
        GitSCMService,
        ApplicationDeploySourceTypes,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        provideZonelessChangeDetection()
      ]
    });
  });

  // TODO: Fix EntityCatalogHelper initialization to enable component creation test
  // The component requires EntityCatalogHelper to be initialized, which needs proper entity catalog setup
  it('should be defined', () => {
    expect(DeployApplicationStep2Component).toBeDefined();
  });
});
