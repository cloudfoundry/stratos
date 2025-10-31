import { Injectable } from '@angular/core';
import { entityCatalog, EndpointHealthCheck, EndpointModel } from '@stratosui/store';

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
    const catalogEntity = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type);
    if (!catalogEntity || !catalogEntity.definition) {
      return; // Skip health check if endpoint type not registered in catalog
    }
    const epType = catalogEntity.definition;
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
