import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { AppMetadataTypes } from '../actions/app-metadata.actions';
import { AppVariables, AppVariablesUpdate } from '../actions/app-variables.actions';
import { UpdateExistingApplication } from '../actions/application.actions';
import { AppState } from '../app-state';



@Injectable()
export class AppVariablesEffect {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect() apiRequestStart$ = this.actions$.pipe(
    ofType<AppVariablesUpdate>(AppVariables.UPDATE),
    map((apiAction: AppVariablesUpdate) => {
      return new UpdateExistingApplication(
        apiAction.appGuid,
        apiAction.cfGuid,
        { ...apiAction.updatedApplication },
        null,
        [AppMetadataTypes.ENV_VARS]
      );
    }));
}

