import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { AppMetadataTypes } from '../../actions/app-metadata.actions';
import { AppVariables, AppVariablesUpdate } from '../../actions/app-variables.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';


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
