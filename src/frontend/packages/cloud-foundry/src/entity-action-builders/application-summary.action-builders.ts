import type { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetAppSummaryAction } from '../actions/app-metadata.actions';

export interface AppSummaryActionBuilders extends OrchestratedActionBuilders {
  get: (appGuid: string, endpointGuid: string) => GetAppSummaryAction;
}

export const appSummaryActionBuilders: AppSummaryActionBuilders = {
  get: (appGuid: string, endpointGuid: string) => new GetAppSummaryAction(appGuid, endpointGuid)
};
