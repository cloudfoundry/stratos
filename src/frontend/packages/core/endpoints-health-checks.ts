import { Injectable } from '@angular/core';

import { entityCatalog } from '../store/src/entity-catalog/entity-catalog';
import { EndpointModel } from '../store/src/types/endpoint.types';


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

@Injectable({
  providedIn: 'root'
})
export class EndpointHealthChecks {
  constructor() { }
  private healthChecks: EndpointHealthCheck[] = [];

  public registerHealthCheck(healthCheck: EndpointHealthCheck) {
    this.healthChecks.push(healthCheck);
  }

  public checkEndpoint(endpoint: EndpointModel) {
    const epType = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition;
    if (endpoint.connectionStatus === 'connected' || epType.unConnectable) {
      const healthCheck = this.healthChecks.find(check => {
        return check.endpointType === endpoint.cnsi_type;
      });
      if (healthCheck) {
        healthCheck.check(endpoint);
      }
    }
  }
}
