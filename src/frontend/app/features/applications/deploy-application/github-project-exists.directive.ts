import { Directive, forwardRef } from '@angular/core';
import { NG_ASYNC_VALIDATORS, Validator, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { Observable } from 'rxjs/Observable';
import { CheckProjectExists } from '../../../store/actions/deploy-applications.actions';
import { selectDeployAppState } from '../../../store/selectors/deploy-application.selector';

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

  validate(c: AbstractControl): Observable<{ githubProjectExists: boolean } | null> {
    if (c.value) {
      return this.store.select(selectDeployAppState)
        .debounceTime(250)
        .do(createAppState => {
          if (createAppState.projectExists && createAppState.projectExists.name !== c.value) {
            this.store.dispatch(new CheckProjectExists(c.value));
          }
        })
        .filter(createAppState => {
          return !createAppState.projectExists.checking &&
            createAppState.projectExists.name === c.value;
        })
        .map(createAppState => {
          return createAppState.projectExists.exists ? null : {
            githubProjectExists: !createAppState.projectExists.exists
          };
        }).first();
    } else {
      return Observable.of(null).first();
    }
  }

}
