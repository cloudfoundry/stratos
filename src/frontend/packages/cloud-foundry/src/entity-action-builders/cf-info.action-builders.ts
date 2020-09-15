import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { GetCFInfo } from '../actions/cloud-foundry.actions';

export interface CfInfoDefinitionActionBuilders extends OrchestratedActionBuilders {
  get: (cfGuid: string) => GetCFInfo;
}

export const cfInfoDefinitionActionBuilders: CfInfoDefinitionActionBuilders = {
  get: (cfGuid: string) => new GetCFInfo(cfGuid),
};
