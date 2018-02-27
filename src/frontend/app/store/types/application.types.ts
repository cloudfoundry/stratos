export enum CfApplicationState {
  STOPPED = 'STOPPED',
  STARTED = 'STARTED'
}

export interface CfApplication {
  name: string;
  space_guid: string;
  state?: CfApplicationState;
  memory?: number;
  instances?: number;
}
