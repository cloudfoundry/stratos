import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { AppMetadataTypes } from '../../actions/app-metadata.actions';
import { AppVariables, AppVariablesUpdate } from '../../actions/app-variables.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';


// AppVariables.UPDATE is dispatched by AppEnvVarActionBuilders
// (delete/edit/add) wired into cfEntityCatalog.appEnvVar.actions; this
// effect translates that into the application.actions.update call that
// re-fetches the app's env-var envelope.
@Injectable({
  providedIn: 'root'
})
export class AppVariablesEffect {
  private actions$ = inject(Actions);
  private appRef = inject(ApplicationRef);


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
