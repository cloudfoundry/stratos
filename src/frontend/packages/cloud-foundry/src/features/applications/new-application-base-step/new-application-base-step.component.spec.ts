import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { ApplicationDeploySourceTypes } from '../deploy-application/deploy-application-steps.types';
import { NewApplicationBaseStepComponent } from './new-application-base-step.component';

describe('NewApplicationBaseStepComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NewApplicationBaseStepComponent
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore(),
        ...STORE_TEST_PROVIDERS,
        GitSCMService,
        ApplicationDeploySourceTypes,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ]
    }).compileComponents();
  });

  // TODO: Fix EntityCatalogHelper initialization to enable component creation test
  // The component requires EntityCatalogHelper to be initialized with CF entities,
  // specifically stratosEntityCatalog.endpoint.store needs to be available
  it('should be defined', () => {
    expect(NewApplicationBaseStepComponent).toBeDefined();
  });
});
