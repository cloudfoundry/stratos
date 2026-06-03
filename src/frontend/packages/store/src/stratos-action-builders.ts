import { GetSystemInfo } from './actions/system.actions';
import { OrchestratedActionBuilders } from './entity-catalog/action-orchestrator/action-orchestrator';

export interface SystemInfoActionBuilder extends OrchestratedActionBuilders {
  getSystemInfo: (
    login?: boolean,
  ) => GetSystemInfo;
}
export const systemInfoActionBuilder: SystemInfoActionBuilder = {
  getSystemInfo: (login?: false) => new GetSystemInfo(login)
};

