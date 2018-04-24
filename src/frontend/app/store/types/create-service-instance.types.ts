
export interface CreateServiceInstanceState {
  name: string;
  servicePlanGuid: string;
  spaceGuid: string;
  parameters?: string;
  tags?: string[];
  bindAppGuid?: string;
}
