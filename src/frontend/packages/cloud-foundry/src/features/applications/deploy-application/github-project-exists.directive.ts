import { Directive, forwardRef, Input, inject } from '@angular/core';
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
export class GithubProjectExistsDirective implements Validator {

  @Input() appGithubProjectExists!: string;

  private lastValue = '';

  private scmService = inject(GitSCMService);
  private deployData = inject(CfDeployAppDataService);
  private deployState$ = toObservable(this.deployData.state);

  // Reduce API calls trying to validate until we have a valid name
  // Must be of the form USER/NAME - where NAME must be at least 2 charts in length
  private isValidProjectName(name: string) {
    const parts = name.split('/');
    return parts.length === 2 && parts[1].length > 2;
  }

  private haveAlreadyChecked(name: string) {
    return this.lastValue.length && this.lastValue.indexOf(name) === 0;
  }

  private getTypeAndEndpointWithAuth(): [GitSCMType, string, string] {
    const res = this.appGithubProjectExists.split(',');
    if (res.length === 3) {
      return [res[0] as GitSCMType, res[1], res[2]];
    }
    console.warn('appGithubProjectExists value should be `<scm type>,<endpoint guid>,<access token>`');
    return null;
  }


  validate(c: AbstractControl): Observable<GithubProjectExistsResponse> {
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
          if (createAppState?.projectExists && createAppState.projectExists.name !== c.value) {
            this.deployData.checkProjectExists(
              this.scmService.getSCM(...this.getTypeAndEndpointWithAuth()),
              c.value,
            );
          }
        }),
        filter(createAppState =>
          !!createAppState?.projectExists &&
          !createAppState.projectExists.checking &&
          createAppState.projectExists.name === c.value
        ),
        map((createAppState): GithubProjectExistsResponse =>
          createAppState.projectExists.exists ? null : {
            githubProjectDoesNotExist: !createAppState.projectExists.exists,
            githubProjectError: createAppState.projectExists.error ? createAppState.projectExists.data || '' : ''
          }),
        take(1)
      );
    } else {
      this.lastValue = c.value;
      return observableOf(null).pipe(take(1));
    }
  }

}
