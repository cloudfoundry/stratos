import { generateStratosEntities, stratosEntityCatalog } from '@stratosui/store';

import { BaseEndpointAuth } from '../../core/endpoint-auth';
import { MetricsEndpointDetailsComponent } from './metrics-endpoint-details/metrics-endpoint-details.component';

/**
 * The Stratos entities, completed with what only core can supply.
 *
 * The Metrics endpoint is declared in @stratosui/store, which may not import
 * core, so it is declared without these and gets them here:
 * - its auth types: a username and password, or no login (the two the
 *   jetstream metrics plugin accepts). Without them the Register stepper
 *   offers no Connect step for Metrics.
 * - its endpoint card details ("N / M sources").
 */
export function generateCoreStratosEntities() {
  const entities = generateStratosEntities();
  stratosEntityCatalog.metricsEndpoint.setAuthTypes([BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.None]);
  stratosEntityCatalog.metricsEndpoint.setListComponent(MetricsEndpointDetailsComponent);
  return entities;
}
