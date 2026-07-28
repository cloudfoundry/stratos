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

  // Regression guard: an async validator only re-runs when its own control
  // (the project name) changes. When a PAT is added AFTER the project name is
  // already entered, the token/auth context changes but the project name does
  // not — so without OnChanges re-triggering validation, a stale
  // "does not exist" from the earlier unauthenticated lookup would persist.
  it('re-triggers validation when the auth context (token) changes', () => {
    const directive = TestBed.runInInjectionContext(() => new GithubProjectExistsDirective());
    let reRuns = 0;
    directive.registerOnValidatorChange(() => reRuns++);

    // Initial value (no token) — first assignment establishes the baseline.
    directive.appGithubProjectExists = 'github,,';
    directive.ngOnChanges({
      appGithubProjectExists: { currentValue: 'github,,', previousValue: undefined, firstChange: true, isFirstChange: () => true },
    } as any);
    expect(reRuns).toBe(1);

    // Token added — auth context changed, so validation must re-run.
    directive.appGithubProjectExists = 'github,,ghp_secrettoken';
    directive.ngOnChanges({
      appGithubProjectExists: { currentValue: 'github,,ghp_secrettoken', previousValue: 'github,,', firstChange: false, isFirstChange: () => false },
    } as any);
    expect(reRuns).toBe(2);

    // Same value again — no auth change, so no extra re-run.
    directive.ngOnChanges({
      appGithubProjectExists: { currentValue: 'github,,ghp_secrettoken', previousValue: 'github,,ghp_secrettoken', firstChange: false, isFirstChange: () => false },
    } as any);
    expect(reRuns).toBe(2);
  });

  it('preserves commas in the access token when splitting the auth context', () => {
    const directive = TestBed.runInInjectionContext(() => new GithubProjectExistsDirective());
    directive.appGithubProjectExists = 'github,,tok,en,with,commas';
    const parsed = (directive as any).getTypeAndEndpointWithAuth();
    expect(parsed).toEqual(['github', '', 'tok,en,with,commas']);
  });
});
