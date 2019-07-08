import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAppEnvVarsAction } from '../actions/app-metadata.actions';
import { ListAppEnvVar } from '../../../core/src/shared/components/list/list-types/app-variables/cf-app-variables-data-source';
import { AppVariablesDelete, AppVariablesEdit, AppVariablesAdd } from '../actions/app-variables.actions';

// App variables are a special case where the entities are actually embedded in an application.s
// This means that most actions are not standard api actions.
export const appEnvVarActionBuilders = {
  get: (appGuid, endpointGuid) => new GetAppEnvVarsAction(appGuid, endpointGuid),
  removeFromApplication: (appGuid, endpointGuid, allEnvVars: ListAppEnvVar[], selectedItems: ListAppEnvVar[]) => new AppVariablesDelete(
    endpointGuid,
    appGuid,
    allEnvVars,
    selectedItems
  ),
  editInApplication: (appGuid, endpointGuid, allEnvVars: ListAppEnvVar[], editedEnvVar: ListAppEnvVar) => new AppVariablesEdit(
    endpointGuid,
    appGuid,
    allEnvVars,
    editedEnvVar
  ),
  addNewToApplication: (appGuid, endpointGuid, allEnvVars: ListAppEnvVar[], newEnvVar: ListAppEnvVar) => new AppVariablesAdd(
    endpointGuid,
    appGuid,
    allEnvVars,
    newEnvVar
  )
} as OrchestratedActionBuilders;
