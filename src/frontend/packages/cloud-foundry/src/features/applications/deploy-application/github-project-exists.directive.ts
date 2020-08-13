import { Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, Validator } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { debounceTime, filter, first, map, tap } from 'rxjs/operators';

import { CheckProjectExists } from '../../../../../cloud-foundry/src/actions/deploy-applications.actions';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { selectDeployAppState } from '../../../../../cloud-foundry/src/store/selectors/deploy-application.selector';
import { GitSCMService, GitSCMType } from '../../../shared/data-services/scm/scm.service';

interface GithubProjectExistsResponse {
  githubProjectDoesNotExist: boolean;
  githubProjectError: string;
}

/* tslint:disable:no-use-before-declare  */
const GITHUB_PROJECT_EXISTS = {
  provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => GithubProjectExistsDirective), multi: true
};
/* tslint:enable */

@Directive({
  selector: '[appGithubProjectExists][ngModel]',
  providers: [GITHUB_PROJECT_EXISTS]
})
export class GithubProjectExistsDirective implements Validator {

  @Input() appGithubProjectExists: string;

  private lastValue = '';

  constructor(private store: Store<CFAppState>, private scmService: GitSCMService) { }

  // Reduce API calls trying to validate until we have a valid name
  // Must be of the form USER/NAME - where NAME must be at least 2 charts in length
  private isValidProjectName(name: string) {
    const parts = name.split('/');
    return parts.length === 2 && parts[1].length > 2;
  }

  private haveAlreadyChecked(name: string) {
    return this.lastValue.length && this.lastValue.indexOf(name) === 0;
  }

  validate(c: AbstractControl): Observable<GithubProjectExistsResponse> {
    if (c.value) {
      if (!this.isValidProjectName(c.value) || this.haveAlreadyChecked(c.value)) {
        return observableOf({
          githubProjectDoesNotExist: true,
          githubProjectError: ''
        }).pipe(first());
      }
      // We should check for a '/' char
      return this.store.select(selectDeployAppState).pipe(
        debounceTime(250),
        tap(createAppState => {
          if (createAppState.projectExists && createAppState.projectExists.name !== c.value) {
            this.store.dispatch(new CheckProjectExists(this.scmService.getSCM(this.appGithubProjectExists as GitSCMType), c.value));
          }
        }),
        filter(createAppState =>
          !createAppState.projectExists.checking &&
          createAppState.projectExists.name === c.value
        ),
        map((createAppState): GithubProjectExistsResponse =>
          createAppState.projectExists.exists ? null : {
            githubProjectDoesNotExist: !createAppState.projectExists.exists,
            githubProjectError: createAppState.projectExists.error ? createAppState.projectExists.data || '' : ''
          }),
        first()
      );
    } else {
      this.lastValue = c.value;
      return observableOf(null).pipe(first());
    }
  }

}
