import { Store } from '@ngrx/store';
import { AppState } from '../app-state';
import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { AppVariablesUpdate, AppVariables } from '../actions/app-variables.actions';
import { UpdateExistingApplication } from '../actions/application.actions';
import { AppMetadataTypes } from '../actions/app-metadata.actions';


@Injectable()
export class AppVariablesEffect {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
  ) { }

  @Effect() apiRequestStart$ = this.actions$.ofType<AppVariablesUpdate>(AppVariables.UPDATE)
    .map((apiAction: AppVariablesUpdate) => {
      return new UpdateExistingApplication(
        apiAction.appGuid,
        apiAction.cfGuid,
        { ...apiAction.updatedApplication },
        null,
        [AppMetadataTypes.ENV_VARS]
      );
    });
}

