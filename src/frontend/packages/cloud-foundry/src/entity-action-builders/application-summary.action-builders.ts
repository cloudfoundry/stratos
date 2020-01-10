import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppSummaryAction } from '../actions/app-metadata.actions';

export const appSummaryActionBuilders = {
  get: (appGuid, endpointGuid) => new GetAppSummaryAction(appGuid, endpointGuid)
} as OrchestratedActionBuilders;
