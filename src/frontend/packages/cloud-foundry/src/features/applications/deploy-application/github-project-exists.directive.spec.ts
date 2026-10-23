import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { createBasicStoreModule } from '@test-framework';
import { CfDeployAppDataService } from '../../../services/domain-data/cf-deploy-app-data.service';
import { GithubProjectExistsDirective } from './github-project-exists.directive';

@Component({
  imports: [FormsModule, GithubProjectExistsDirective],
  template: `<input name="project" [ngModel]="''" [appGithubProjectExists]="context()">`,
})
class TestHostComponent {
  readonly context = signal('');
}

describe('GithubProjectExistsDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        TestHostComponent,
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

  // The auth context reaches the directive through a template binding, the
  // way the deploy wizard sets it, so Angular drives ngOnChanges.
  async function createHost(context: string) {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.context.set(context);
    await fixture.whenStable();
    const directive = fixture.debugElement.query(By.directive(GithubProjectExistsDirective))
      .injector.get(GithubProjectExistsDirective);
    return { fixture, directive };
  }

  // Regression guard: an async validator only re-runs when its own control
  // (the project name) changes. When a PAT is added AFTER the project name is
  // already entered, the token/auth context changes but the project name does
  // not — so without OnChanges re-triggering validation, a stale
  // "does not exist" from the earlier unauthenticated lookup would persist.
  it('re-triggers validation when the auth context (token) changes', async () => {
    // First change only records the baseline — it must NOT re-run validation
    // or clear cached state (see redeploy-seed guard below).
    // Value shape: `<scm type>,<endpoint guid>,<base api url>,<access token>`.
    const { fixture, directive } = await createHost('github,,,');
    let reRuns = 0;
    directive.registerOnValidatorChange(() => reRuns++);
    expect(reRuns).toBe(0);

    // Token added — auth context changed, so validation must re-run.
    fixture.componentInstance.context.set('github,,,ghp_secrettoken');
    await fixture.whenStable();
    expect(reRuns).toBe(1);

    // Same value again — no auth change, so no extra re-run.
    directive.ngOnChanges({
      appGithubProjectExists: { currentValue: 'github,,,ghp_secrettoken', previousValue: 'github,,,ghp_secrettoken', firstChange: false, isFirstChange: () => false },
    } as any);
    expect(reRuns).toBe(1);
  });

  // Regression guard (PR #5707 review): the redeploy path pre-seeds
  // checkProjectExists() before the wizard renders, and this directive is
  // constructed on first render even in a non-active step. The first
  // ngOnChanges must NOT clear that seeded projectExists state, or the
  // repository info card disappears on redeploy (the disabled project input
  // never re-runs its async validator to rebuild it).
  it('does not clear seeded projectExists state on the first change', async () => {
    const clearSpy = vi.spyOn(TestBed.inject(CfDeployAppDataService), 'projectDoesntExist');

    await createHost('github,747ed39a-guid,,');

    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('preserves commas in the access token when splitting the auth context', async () => {
    const { directive } = await createHost('github,,,tok,en,with,commas');
    const parsed = (directive as any).getTypeAndEndpointWithAuth();
    expect(parsed).toEqual(['github', '', '', 'tok,en,with,commas']);
  });

  it('parses the base api url (GitLab self-hosted) between the guid and the token', async () => {
    const { directive } = await createHost('gitlab,,https://workshop.cloud.gov/api/v4,glpat-xyz');
    const parsed = (directive as any).getTypeAndEndpointWithAuth();
    expect(parsed).toEqual(['gitlab', '', 'https://workshop.cloud.gov/api/v4', 'glpat-xyz']);
  });

  // Nested subgroups are a GitLab feature. GitHub has no nested namespaces, so
  // a three-segment path cannot resolve there and must be rejected locally
  // rather than spending a request to find out.
  describe('isValidProjectName', () => {
    const isValid = (name: string, type?: string) => {
      const directive = TestBed.runInInjectionContext(() => new GithubProjectExistsDirective());
      return (directive as any).isValidProjectName(name, type);
    };

    it('accepts owner/repo for both providers', () => {
      expect(isValid('owner/repo', 'github')).toBe(true);
      expect(isValid('owner/repo', 'gitlab')).toBe(true);
    });

    it('accepts a nested subgroup path only for GitLab', () => {
      expect(isValid('group/subgroup/repo', 'gitlab')).toBe(true);
      expect(isValid('group/subgroup/repo', 'github')).toBe(false);
    });

    it('rejects a bare name with no namespace', () => {
      expect(isValid('repo', 'gitlab')).toBe(false);
      expect(isValid('repo', 'github')).toBe(false);
    });

    it('rejects a project name of 2 characters or fewer', () => {
      expect(isValid('owner/ab', 'gitlab')).toBe(false);
      expect(isValid('group/subgroup/ab', 'gitlab')).toBe(false);
    });

    // An unparseable context string yields no type; fall back to the stricter
    // two-segment rule rather than admitting paths that may not resolve.
    it('applies the stricter rule when the type is unknown', () => {
      expect(isValid('owner/repo')).toBe(true);
      expect(isValid('group/subgroup/repo')).toBe(false);
    });
  });
});
