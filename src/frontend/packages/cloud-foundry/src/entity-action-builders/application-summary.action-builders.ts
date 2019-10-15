import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetAppSummaryAction } from '../actions/app-metadata.actions';

export const appSummaryActionBuilders = {
  get: (appGuid, endpointGuid) => new GetAppSummaryAction(appGuid, endpointGuid)
} as OrchestratedActionBuilders;
