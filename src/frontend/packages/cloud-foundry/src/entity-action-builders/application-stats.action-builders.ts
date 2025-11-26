import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppStatsAction } from '../actions/app-metadata.actions';

export interface AppStatsActionBuilders extends OrchestratedActionBuilders {
  getMultiple: (appGuid: string, endpointGuid: string) => GetAppStatsAction;
}

export const appStatsActionBuilders: AppStatsActionBuilders = {
  getMultiple: (appGuid: string, endpointGuid: string) => new GetAppStatsAction(appGuid, endpointGuid)
};
