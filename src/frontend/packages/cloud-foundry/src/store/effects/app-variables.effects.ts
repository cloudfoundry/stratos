import { ApplicationRef, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { AppMetadataTypes } from '../../actions/app-metadata.actions';
import { AppVariables, type AppVariablesUpdate } from '../../actions/app-variables.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';


@Injectable({
  providedIn: 'root'
})
export class AppVariablesEffect {

  constructor(
    private actions$: Actions,
    private appRef: ApplicationRef
  ) { }

   apiRequestStart$ = createEffect(() => this.actions$.pipe(
    ofType<AppVariablesUpdate>(AppVariables.UPDATE),
    map((apiAction: AppVariablesUpdate) => {
      this.appRef.tick();
      return cfEntityCatalog.application.actions.update(
        apiAction.appGuid,
        apiAction.cfGuid,
        { ...apiAction.updatedApplication },
        null,
        [AppMetadataTypes.ENV_VARS]
      );
    })
  ));
}
