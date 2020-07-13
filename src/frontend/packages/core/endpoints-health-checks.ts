import { Injectable } from '@angular/core';

import { entityCatalog } from '../store/src/entity-catalog/entity-catalog';
import { EndpointHealthCheck } from '../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel } from '../store/src/types/endpoint.types';

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
