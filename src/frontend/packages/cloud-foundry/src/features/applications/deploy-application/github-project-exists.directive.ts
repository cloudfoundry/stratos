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

  // Value shape: `<scm type>,<endpoint guid>,<access token>`. Changing the
  // token (or endpoint) must re-trigger validation — an NgControl async
  // validator only re-runs when its OWN control (the project name) changes,
  // so without OnChanges a token added AFTER the project name was entered
  // would never be re-checked, leaving a stale "does not exist" from the
  // earlier unauthenticated lookup.
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

  // Reduce API calls trying to validate until we have a valid name
  // Must be of the form USER/NAME - where NAME must be at least 2 charts in length
  private isValidProjectName(name: string) {
    const parts = name.split('/');
    return parts.length === 2 && parts[1].length > 2;
  }

  private haveAlreadyChecked(name: string) {
    return this.lastValue.length && this.lastValue.indexOf(name) === 0;
  }

  private getTypeAndEndpointWithAuth(): [GitSCMType, string, string] | null {
    const res = this.appGithubProjectExists.split(',');
    if (res.length >= 3) {
      // A PAT can legitimately contain commas — rejoin everything after the
      // scm type + endpoint guid so the token is passed intact.
      return [res[0] as GitSCMType, res[1], res.slice(2).join(',')];
    }
    console.warn('appGithubProjectExists value should be `<scm type>,<endpoint guid>,<access token>`');
    return null;
  }


  validate(c: AbstractControl): Observable<GithubProjectExistsResponse | null> {
    if (c.value) {
      if (!this.isValidProjectName(c.value) || this.haveAlreadyChecked(c.value)) {
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
            this.deployData.checkProjectExists(
              this.scmService.getSCM(...typeAndEndpoint),
              c.value,
            );
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
