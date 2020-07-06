import { Action } from '@ngrx/store';

import { ListAppEnvVar } from '../shared/components/list/list-types/app-variables/cf-app-variables-data-source';
import { UpdateApplication } from './application.actions';

export const AppVariables = {
  UPDATE: '[Application Variables] Update',
};

export class AppVariablesUpdate implements Action {

  type = AppVariables.UPDATE;
  updatedApplication: UpdateApplication;

  constructor(public cfGuid: string, public appGuid: string) {
    this.guid = 'n/a' // No such thing as an individual app variable guid
  }

  protected createUpdateApplication(allEnvVars: ListAppEnvVar[], selectedItems: ListAppEnvVar[]): UpdateApplication {
    const updateApp: UpdateApplication = {
      environment_json: {},
    };
    for (const row of allEnvVars) {
      // Only include if we're ignoring the selection or it doesn't exist in the selected items
      if (!selectedItems || selectedItems.findIndex((item => item.name === row.name)) < 0) {
        updateApp.environment_json[row.name] = row.value;
      }
    }
    return updateApp;
  }
  guid: string;
}

export class AppVariablesDelete extends AppVariablesUpdate {
  constructor(cfGuid: string, appGuid: string, allEnvVars: ListAppEnvVar[], selectedItems: ListAppEnvVar[]) {
    super(cfGuid, appGuid);
    this.updatedApplication = this.createUpdateApplication(allEnvVars, selectedItems);
  }
}

export class AppVariablesEdit extends AppVariablesUpdate {
  constructor(cfGuid: string, appGuid: string, allEnvVars: ListAppEnvVar[], editedEnvVar: ListAppEnvVar) {
    super(cfGuid, appGuid);
    this.updatedApplication = this.createUpdateApplication(allEnvVars, null);
    this.updatedApplication.environment_json[editedEnvVar.name] = editedEnvVar.value;
  }
}

export class AppVariablesAdd extends AppVariablesUpdate {
  constructor(cfGuid: string, appGuid: string, allEnvVars: ListAppEnvVar[], addedEnvVar: ListAppEnvVar) {
    super(cfGuid, appGuid);
    this.updatedApplication = this.createUpdateApplication(allEnvVars, null);
    this.updatedApplication.environment_json[addedEnvVar.name] = addedEnvVar.value;
  }
}

