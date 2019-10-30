import { GetCFInfo } from '../actions/cloud-foundry.actions';
import { CFOrchestratedActionBuilders } from './cf.action-builder.types';

export interface CfInfoDefinitionActionBuilders extends CFOrchestratedActionBuilders {
  get: (cfGuid: string) => GetCFInfo;
}

export const cfInfoDefinitionActionBuilders: CfInfoDefinitionActionBuilders = {
  get: (cfGuid: string) => new GetCFInfo(cfGuid),
};
