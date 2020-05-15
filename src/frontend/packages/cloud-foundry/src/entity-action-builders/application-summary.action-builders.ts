import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppSummaryAction } from '../actions/app-metadata.actions';

export interface AppSummaryActionBuilders extends OrchestratedActionBuilders {
  get: (appGuid, endpointGuid) => GetAppSummaryAction;
}

export const appSummaryActionBuilders: AppSummaryActionBuilders = {
  get: (appGuid, endpointGuid) => new GetAppSummaryAction(appGuid, endpointGuid)
};
