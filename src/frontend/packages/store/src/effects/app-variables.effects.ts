import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { AppMetadataTypes } from '../../../cloud-foundry/src/actions/app-metadata.actions';
import { AppVariables, AppVariablesUpdate } from '../../../cloud-foundry/src/actions/app-variables.actions';
import { UpdateExistingApplication } from '../../../cloud-foundry/src/actions/application.actions';
import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';



@Injectable()
export class AppVariablesEffect {

  constructor(
    private actions$: Actions,
    private store: Store<CFAppState>,
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

