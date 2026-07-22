import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppEnvVarsAction } from '../actions/app-metadata.actions';

export interface AppEnvVarActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (appGuid: string, endpointGuid: string) => GetAppEnvVarsAction;
}

export const appEnvVarActionBuilders: AppEnvVarActionBuilders = {
  getMultiple: (appGuid: string, endpointGuid: string) => new GetAppEnvVarsAction(appGuid, endpointGuid),
};
