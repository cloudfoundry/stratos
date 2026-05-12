import { HttpClient } from '@angular/common/http';
import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { GitSCMService } from '@stratosui/git';
import { of as observableOf } from 'rxjs';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';

import {
  CHECK_PROJECT_EXISTS,
  CheckProjectExists,
  ProjectDoesntExist,
  ProjectExists,
  ProjectFetchFail,
} from '../../actions/deploy-applications.actions';
import { CFAppState } from '../../cf-app-state';
import { selectDeployAppState } from '../selectors/deploy-application.selector';


// CF effects retention (wave-3 CF-effects audit, 2026-05-12):
// Retained — CheckProjectExists is dispatched via store.dispatch from
// github-project-exists.directive.ts:67 and
// github-commits-list-config-app-tab.service.ts:53. Both are live
// consumers (deploy-application form + per-app GitHub commits list).
@Injectable({
  providedIn: 'root'
})
export class DeployAppEffects {
  private actions$ = inject(Actions);
  private store = inject<Store<CFAppState>>(Store);
  private httpClient = inject(HttpClient);
  private gitSCMService = inject(GitSCMService);
  private appRef = inject(ApplicationRef);


  
  checkAppExists$ = createEffect(() => this.actions$.pipe(
    ofType<CheckProjectExists>(CHECK_PROJECT_EXISTS),
    withLatestFrom(this.store.select(selectDeployAppState)),
    filter(([, state]) => {
      return state.projectExists && state.projectExists.checking;
    }),
    switchMap(([action, _state]: [CheckProjectExists, any]) => {
      return action.scm.getRepository(this.httpClient, action.projectName).pipe(
        map(res => {
          this.appRef.tick();
          return new ProjectExists(action.projectName, res);
        }),
        catchError(err => {
          this.appRef.tick();
          return observableOf(err.status === 404 ?
            new ProjectDoesntExist(action.projectName) :
            new ProjectFetchFail(action.projectName, action.scm.parseErrorAsString(err))
          );
        })
      );
    })
  ));

}
