
export interface CreateServiceInstanceState {
  name: string;
  servicePlanGuid: string;
  spaceGuid: string;
  orgGuid: string;
  parameters?: string;
  tags?: string[];
  bindAppGuid?: string;
  serviceInstanceGuid?: string;
}
