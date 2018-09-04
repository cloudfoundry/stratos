import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_ASYNC_VALIDATORS, Validator } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { debounceTime, filter, first, map, tap } from 'rxjs/operators';

import { CheckProjectExists } from '../../../store/actions/deploy-applications.actions';
import { AppState } from '../../../store/app-state';
import { selectDeployAppState } from '../../../store/selectors/deploy-application.selector';

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

  constructor(private store: Store<AppState>) { }

  validate(c: AbstractControl): Observable<GithubProjectExistsResponse> {
    if (c.value) {
      return this.store.select(selectDeployAppState).pipe(
        debounceTime(250),
        tap(createAppState => {
          if (createAppState.projectExists && createAppState.projectExists.name !== c.value) {
            this.store.dispatch(new CheckProjectExists(c.value));
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
      return observableOf(null).pipe(first());
    }
  }

}
