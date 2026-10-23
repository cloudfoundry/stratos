import { generateStratosEntities, stratosEntityCatalog } from '@stratosui/store';

import { BaseEndpointAuth } from '../../core/endpoint-auth';

/**
 * The Stratos entities, completed with what only core can supply.
 *
 * The Metrics endpoint is declared in @stratosui/store, which may not import
 * core, so it is declared without auth types and gets them here: a username
 * and password, or no login (the two the jetstream metrics plugin accepts).
 * Without them the Register stepper offers no Connect step for Metrics.
 */
export function generateCoreStratosEntities() {
  const entities = generateStratosEntities();
  stratosEntityCatalog.metricsEndpoint.setAuthTypes([BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.None]);
  return entities;
}
