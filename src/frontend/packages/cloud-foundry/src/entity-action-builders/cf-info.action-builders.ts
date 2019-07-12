import { GetCFInfo } from '../actions/cloud-foundry.actions';
import { CFOrchestratedActionBuilders } from './cf.action-builder.types';

export interface CfInfoDefinitionActionBuilders extends CFOrchestratedActionBuilders {
  get?(
    cfGuid,
  ): GetCFInfo;
}

export const cfInfoDefinitionActionBuilders: CfInfoDefinitionActionBuilders = {
  get: (
    cfGuid,
  ) => new GetCFInfo(
    cfGuid
  ),
};
