import { Directive, forwardRef, Input, inject, OnChanges, SimpleChanges } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AbstractControl, NG_ASYNC_VALIDATORS, Validator } from '@angular/forms';
import { GitSCMService, GitSCMType } from '@stratosui/git';
import { Observable, of as observableOf } from 'rxjs';
import { take, debounceTime, filter, map, tap } from 'rxjs/operators';

import { CfDeployAppDataService } from '../../../services/domain-data/cf-deploy-app-data.service';

interface GithubProjectExistsResponse {
  githubProjectDoesNotExist: boolean;
  githubProjectError: string;
}

const GITHUB_PROJECT_EXISTS = {
  provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => GithubProjectExistsDirective), multi: true
};

@Directive({
  selector: '[appGithubProjectExists][ngModel]',
  providers: [GITHUB_PROJECT_EXISTS],
  standalone: true
})
export class GithubProjectExistsDirective implements Validator, OnChanges {

  // Value shape: `<scm type>,<endpoint guid>,<base api url>,<access token>`.
  // Changing the token, endpoint, or base URL must re-trigger validation — an
  // NgControl async validator only re-runs when its OWN control (the project
  // name) changes, so without OnChanges a token/URL added AFTER the project
  // name was entered would never be re-checked, leaving a stale "does not
  // exist" from the earlier unauthenticated / wrong-host lookup.
  @Input() appGithubProjectExists!: string;

  private lastValue = '';
  // The auth context (scm,guid,token) used for the last check. `undefined`
  // until the first ngOnChanges records the initial value — distinct from ''
  // so we can tell "first render" apart from "token later cleared to empty".
  private lastAuthContext: string | undefined = undefined;

  private onChange?: () => void;

  private scmService = inject(GitSCMService);
  private deployData = inject(CfDeployAppDataService);
  private deployState$ = toObservable(this.deployData.state);

  // Angular calls registerOnValidatorChange with a callback that re-runs this
  // validator. We invoke it when the token/endpoint context changes so a
  // late-entered PAT immediately re-validates the already-typed project.
  registerOnValidatorChange(fn: () => void): void {
    this.onChange = fn;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes.appGithubProjectExists;
    if (!change) {
      return;
    }
    const auth = this.appGithubProjectExists ?? '';

    // First render just records the baseline. Do NOT clear projectExists here:
    // the redeploy path pre-seeds checkProjectExists() before navigating to
    // the wizard (CfDeployAppDataService is providedIn:'root'), and this
    // directive is constructed on first render even when its step isn't active
    // (Ivy doesn't defer <ng-content> in <ng-template>). Clearing on the first
    // change would discard that seeded repo info, and on redeploy the project
    // input is [disabled] so its async validator never re-runs to rebuild it.
    if (this.lastAuthContext === undefined) {
      this.lastAuthContext = auth;
      return;
    }

    if (auth !== this.lastAuthContext) {
      this.lastAuthContext = auth;
      // Auth context genuinely changed (e.g. a PAT typed after the project
      // name). Drop the cached project-exists result so validate()'s
      // name-match guard doesn't short-circuit the re-check, then ask Angular
      // to re-run validation under the new auth.
      this.deployData.projectDoesntExist('');
      this.onChange?.();
    }
  }

  // Reduce API calls trying to validate until we have a valid name.
  // Must be OWNER/NAME, or NAMESPACE/.../NAME on GitLab, whose projects can
  // live in nested subgroups. GitHub has no nested namespaces, so a path with
  // more than two segments cannot resolve there and is rejected without
  // spending a request. The final segment (the project name) must be more
  // than 2 characters either way.
  private isValidProjectName(name: string, type?: GitSCMType) {
    const parts = name.split('/');
    if (parts[parts.length - 1].length <= 2) {
      return false;
    }
    return type === 'gitlab' ? parts.length >= 2 : parts.length === 2;
  }

  private haveAlreadyChecked(name: string) {
    return this.lastValue.length && this.lastValue.indexOf(name) === 0;
  }

  private getTypeAndEndpointWithAuth(): [GitSCMType, string, string, string] | null {
    const res = this.appGithubProjectExists.split(',');
    if (res.length >= 4) {
      // A PAT can legitimately contain commas — rejoin everything after the
      // scm type + endpoint guid + base URL so the token is passed intact.
      // The base URL never contains a comma.
      return [res[0] as GitSCMType, res[1], res[2], res.slice(3).join(',')];
    }
    console.warn('appGithubProjectExists value should be `<scm type>,<endpoint guid>,<base api url>,<access token>`');
    return null;
  }


  validate(c: AbstractControl): Observable<GithubProjectExistsResponse | null> {
    if (c.value) {
      const scmType = this.getTypeAndEndpointWithAuth()?.[0];
      if (!this.isValidProjectName(c.value, scmType) || this.haveAlreadyChecked(c.value)) {
        return observableOf({
          githubProjectDoesNotExist: true,
          githubProjectError: ''
        }).pipe(take(1));
      }
      // We should check for a '/' char
      return this.deployState$.pipe(
        debounceTime(250),
        tap(createAppState => {
          const typeAndEndpoint = this.getTypeAndEndpointWithAuth();
          if (typeAndEndpoint && createAppState?.projectExists && createAppState.projectExists.name !== c.value) {
            const [type, endpointGuid, baseApiUrl, token] = typeAndEndpoint;
            const scm = this.scmService.getSCM(type, endpointGuid, token || undefined);
            // Private/Enterprise mode: the user typed a base URL (GitLab
            // self-hosted, or GitHub Enterprise), so point the validator's SCM
            // at that host. Without this the validator would hit the default
            // public API (gitlab.com / api.github.com) and 404, showing a
            // spurious "Repository not found" for a repo that lives on the
            // self-hosted host. The suggestions path already does this via the
            // component's own SCM; the validator uses its own instance.
            if (baseApiUrl) {
              (scm as unknown as { setPublicApi(url: string): void }).setPublicApi(baseApiUrl);
            }
            this.deployData.checkProjectExists(scm, c.value);
          }
        }),
        filter(createAppState =>
          !!createAppState?.projectExists &&
          !createAppState.projectExists.checking &&
          createAppState.projectExists.name === c.value
        ),
        map((createAppState): GithubProjectExistsResponse | null => {
          // strict: the preceding filter guarantees projectExists is set
          const projectExists = createAppState.projectExists!;
          return projectExists.exists ? null : {
            githubProjectDoesNotExist: !projectExists.exists,
            githubProjectError: projectExists.error ? projectExists.data || '' : ''
          };
        }),
        take(1)
      );
    } else {
      this.lastValue = c.value;
      return observableOf(null).pipe(take(1));
    }
  }

}
