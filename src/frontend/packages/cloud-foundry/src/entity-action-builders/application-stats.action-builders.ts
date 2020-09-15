import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppStatsAction } from '../actions/app-metadata.actions';

export interface AppStatsActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (appGuid, endpointGuid) => GetAppStatsAction;
};

export const appStatsActionBuilders: AppStatsActionBuilders = {
  getMultiple: (appGuid, endpointGuid) => new GetAppStatsAction(appGuid, endpointGuid)
};
