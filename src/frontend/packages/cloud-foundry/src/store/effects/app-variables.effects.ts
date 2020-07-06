import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { AppMetadataTypes } from '../../actions/app-metadata.actions';
import { AppVariables, AppVariablesUpdate } from '../../actions/app-variables.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';


@Injectable()
export class AppVariablesEffect {

  constructor(
    private actions$: Actions,
  ) { }

  @Effect() apiRequestStart$ = this.actions$.pipe(
    ofType<AppVariablesUpdate>(AppVariables.UPDATE),
    map((apiAction: AppVariablesUpdate) => cfEntityCatalog.application.actions.update(
      apiAction.appGuid,
      apiAction.cfGuid,
      { ...apiAction.updatedApplication },
      null,
      [AppMetadataTypes.ENV_VARS]
    ))
  )
}
