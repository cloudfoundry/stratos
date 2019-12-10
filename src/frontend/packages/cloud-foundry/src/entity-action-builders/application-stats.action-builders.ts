import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppStatsAction } from '../actions/app-metadata.actions';

export const appStatsActionBuilders = {
  get: (appGuid, endpointGuid) => new GetAppStatsAction(appGuid, endpointGuid)
} as OrchestratedActionBuilders;
