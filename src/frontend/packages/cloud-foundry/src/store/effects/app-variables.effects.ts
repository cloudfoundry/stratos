import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { AppMetadataTypes } from '../../actions/app-metadata.actions';
import { AppVariables, AppVariablesUpdate } from '../../actions/app-variables.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';


// CF effects retention (wave-3 CF-effects audit, 2026-05-12):
// Retained — AppVariables.UPDATE is still dispatched via the
// AppEnvVarActionBuilders (delete/edit/add) which are wired into
// cfEntityCatalog.appEnvVar.actions and consumed live by the
// cf-app-variables-data-source list (see
// cf-app-variables-data-source.ts:56/66 and
// cf-app-variables-list-config.service.ts:103).
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
