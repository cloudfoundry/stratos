import { describe, expect, it } from 'vitest';

import { StratosCatalogEndpointEntity } from '@stratosui/store';
import { AUTOSCALER_ENDPOINT_TYPE } from './autoscaler-entity-factory';
import { generateASEntities } from './autoscaler-entity-generator';

// The Register dialog showed the Autoscaler tile first, with the Cloud
// Foundry icon, so it was picked by mistake for a Cloud Foundry endpoint.
describe('Autoscaler endpoint definition', () => {
  const endpoint = generateASEntities()
    .find((e): e is StratosCatalogEndpointEntity => e instanceof StratosCatalogEndpointEntity);
  const definition = endpoint!.definition;

  it('is the autoscaler endpoint type', () => {
    expect(definition.type).toBe(AUTOSCALER_ENDPOINT_TYPE);
  });

  it('has its own icon, not the Cloud Foundry one', () => {
    expect(definition.icon).toBe('meter');
    expect(definition.iconFont).toBe('stratos-icons');
  });

  it('sorts after Cloud Foundry (renderPriority 1)', () => {
    expect(definition.renderPriority).toBeGreaterThan(1);
  });
});
