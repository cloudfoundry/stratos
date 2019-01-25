import { EndpointModel } from '../store/types/endpoint.types';

export class EndpointHealthCheck {
  constructor(
    public endpointType: string,
    /*
   To show an error, the check should either call a WrapperRequestActionFailed
   or kick off a chain that eventually calls a WrapperRequestActionFailed
  */
    public check: (endpoint: EndpointModel) => void
  ) { }
}


class EndpointHealthChecks {
  constructor() { }
  private healthChecks: EndpointHealthCheck[] = [];

  public registerHealthCheck(healthCheck: EndpointHealthCheck) {
    this.healthChecks.push(healthCheck);
  }

  public checkEndpoint(endpoint: EndpointModel) {
    if (endpoint.connectionStatus === 'connected') {
      const healthCheck = this.healthChecks.find(check => {
        return check.endpointType === endpoint.cnsi_type;
      });
      if (healthCheck) {
        healthCheck.check(endpoint);
      }
    }
  }
}

export const endpointHealthChecks = new EndpointHealthChecks();
