import { describe, it, expect, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { createBasicStoreModule } from '@test-framework';
import { GithubProjectExistsDirective } from './github-project-exists.directive';

describe('GithubProjectExistsDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        GitSCMService,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
      ]
    }).compileComponents();
  });

  it('should create an instance', () => {
    const directive = TestBed.runInInjectionContext(() => new GithubProjectExistsDirective());
    expect(directive).toBeTruthy();
  });
});
