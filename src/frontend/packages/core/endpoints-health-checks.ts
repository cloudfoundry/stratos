import { EndpointModel } from '../store/src/types/endpoint.types';
import { getEndpointType } from './src/features/endpoints/endpoint-helpers';


export class EndpointHealthCheck {
  /**
   * @param check To show an error, the check should either call a WrapperRequestActionFailed
   * or kick off a chain that eventually calls a WrapperRequestActionFailed
   */
  constructor(
    public endpointType: string,
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
    const epType = getEndpointType(endpoint.cnsi_type, endpoint.sub_type);
    if (endpoint.connectionStatus === 'connected' || epType.doesNotSupportConnect) {
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
