/**
 * Mock catalog entities for testing
 *
 * Provides minimal entity catalog entries to satisfy entity lookups in tests
 * without requiring full CF/K8s package imports, which would create circular dependencies.
 */

import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
  StratosEndpointExtensionDefinition,
  IStratosEntityDefinition,
  IStratosEndpointDefinition,
  EntityCatalogSchemas,
  endpointEntityType,
  EntitySchema,
} from '@stratosui/store';

/**
 * Create a simple entity schema for a mock entity
 */
function createMockSchema(endpointType: string, entityType: string): EntityCatalogSchemas {
  // Create a simple entity schema without circular references using EntitySchema
  const entitySchema = new EntitySchema(entityType, endpointType, {}, {
    idAttribute: (entity: any) => entity?.metadata?.guid || entity?.guid || ''
  });

  return {
    default: entitySchema,
    entity: entitySchema
  };
}

/**
 * Create a minimal mock endpoint entity for testing
 */
function createMockEndpointEntity(endpointType: string, label: string): StratosCatalogEndpointEntity {
  const definition: StratosEndpointExtensionDefinition = {
    type: endpointType,
    label,
    labelPlural: label,
    logoUrl: '',
    authTypes: [],
    icon: '',
    iconFont: '',
    listDetailsComponent: null as any,
    homeCard: null as any,
  };

  // Create a simple schema for the endpoint using EntitySchema
  const endpointSchema = new EntitySchema(endpointEntityType, endpointType, {}, {
    idAttribute: 'guid'
  });

  // Use StratosCatalogEndpointEntity constructor properly
  const endpointEntityDef: IStratosEndpointDefinition = {
    ...definition,
    schema: {
      default: endpointSchema
    }
  };

  return new StratosCatalogEndpointEntity(
    endpointEntityDef,
    (): string => ''
  );
}

/**
 * Create a minimal mock entity for testing
 */
function createMockEntity(
  endpointType: string,
  entityType: string,
  customSchema?: EntityCatalogSchemas
): StratosCatalogEntity {
  const definition: IStratosEntityDefinition = {
    type: entityType,
    schema: customSchema || createMockSchema(endpointType, entityType),
    label: entityType,
    labelPlural: `${entityType}s`,
    endpoint: {
      type: endpointType,
      logoUrl: '',
      authTypes: [],
    },
  };

  return new StratosCatalogEntity(
    definition,
    {
      entityBuilder: {
        getMetadata: (entity: any) => ({
          name: entity?.entity?.name || entity?.name || '',
          guid: entity?.metadata?.guid || entity?.guid || '',
        }),
        getLink: (): string | null => null,
        getGuid: (entity: any) => entity?.metadata?.guid || entity?.guid || '',
      }
    }
  );
}

/**
 * Generate minimal mock CF entities for testing
 * These are lightweight stubs that satisfy catalog lookups without full CF package dependencies
 */
export function generateMockCFEntities(): StratosBaseCatalogEntity[] {
  const CF_ENDPOINT_TYPE = 'cf';

  const cfEndpoint = createMockEndpointEntity(CF_ENDPOINT_TYPE, 'Cloud Foundry');

  // Create minimal entities for common CF types used in tests
  const cfEntities: StratosBaseCatalogEntity[] = [
    cfEndpoint,
    createMockEntity(CF_ENDPOINT_TYPE, 'application'),
    createMockEntity(CF_ENDPOINT_TYPE, 'organization'),
    createMockEntity(CF_ENDPOINT_TYPE, 'space'),
    createMockEntity(CF_ENDPOINT_TYPE, 'route'),
    createMockEntity(CF_ENDPOINT_TYPE, 'domain'),
    createMockEntity(CF_ENDPOINT_TYPE, 'service'),
    createMockEntity(CF_ENDPOINT_TYPE, 'serviceInstance'),
    createMockEntity(CF_ENDPOINT_TYPE, 'servicePlan'),
    createMockEntity(CF_ENDPOINT_TYPE, 'serviceBinding'),
    createMockEntity(CF_ENDPOINT_TYPE, 'user'),
    createMockEntity(CF_ENDPOINT_TYPE, 'event'),
  ];

  return cfEntities;
}

/**
 * Generate minimal mock Metrics entities for testing
 */
export function generateMockMetricsEntities(): StratosBaseCatalogEntity[] {
  const METRICS_ENDPOINT_TYPE = 'metrics';
  return [
    createMockEndpointEntity(METRICS_ENDPOINT_TYPE, 'Metrics'),
  ];
}

/**
 * Generate minimal mock Kubernetes entities for testing
 */
export function generateMockKubeEntities(): StratosBaseCatalogEntity[] {
  const K8S_ENDPOINT_TYPE = 'k8s';

  const k8sEndpoint = createMockEndpointEntity(K8S_ENDPOINT_TYPE, 'Kubernetes');

  // Create minimal entities for common K8s types used in tests
  const k8sEntities: StratosBaseCatalogEntity[] = [
    k8sEndpoint,
    createMockEntity(K8S_ENDPOINT_TYPE, 'pod'),
    createMockEntity(K8S_ENDPOINT_TYPE, 'deployment'),
    createMockEntity(K8S_ENDPOINT_TYPE, 'service'),
    createMockEntity(K8S_ENDPOINT_TYPE, 'namespace'),
    createMockEntity(K8S_ENDPOINT_TYPE, 'node'),
    createMockEntity(K8S_ENDPOINT_TYPE, 'statefulSet'),
    createMockEntity(K8S_ENDPOINT_TYPE, 'daemonSet'),
  ];

  // Also register 'kubernetes' as an alias (some tests use this variant)
  const kubernetesEndpoint = createMockEndpointEntity('kubernetes', 'Kubernetes');
  const kubernetesEntities: StratosBaseCatalogEntity[] = [
    kubernetesEndpoint,
    createMockEntity('kubernetes', 'deployment'),
    createMockEntity('kubernetes', 'pod'),
    createMockEntity('kubernetes', 'service'),
    createMockEntity('kubernetes', 'namespace'),
  ];

  return [...k8sEntities, ...kubernetesEntities];
}

/**
 * Generate generic mock entities for test stubs
 * These are for tests that use placeholder entity types like 'endpointType' and 'entityType'
 */
export function generateGenericMockEntities(): StratosBaseCatalogEntity[] {
  // Some tests use literal strings 'endpointType' and 'entityType' as placeholders
  // Create mock entities for these to prevent catalog lookup warnings
  // Also add 'endpoint' entity type for endpoint favorites (used by metrics and other endpoints)
  return [
    createMockEndpointEntity('endpointType', 'Test Endpoint'),
    createMockEntity('endpointType', 'entityType'),
    createMockEntity('metrics', 'endpoint'),
  ];
}

/**
 * Generate all mock entities needed for core tests
 * Includes CF and K8s entities to prevent catalog lookup warnings
 *
 * NOTE: This should only be used when the real CF/K8s entities are NOT registered.
 * If you're using CloudFoundryTestingModule or similar, don't use this function
 * as it will create duplicate registrations.
 */
export function generateMockTestEntities(): StratosBaseCatalogEntity[] {
  return [
    ...generateMockCFEntities(),
    ...generateMockKubeEntities(),
    ...generateMockMetricsEntities(),
    ...generateGenericMockEntities(),
  ];
}

/**
 * Safe version that checks for duplicates before returning mock entities
 * This is useful when you're not sure if real entities are already registered
 */
export function generateMockTestEntitiesSafe(existingEntities: StratosBaseCatalogEntity[] = []): StratosBaseCatalogEntity[] {
  const existingTypes = new Set<string>();

  // Build set of already registered endpoint + entity type combinations
  existingEntities.forEach(entity => {
    if ('definition' in entity && entity.definition) {
      if ('endpoint' in entity.definition && entity.definition.endpoint) {
        // Regular entity: endpoint.type + entity.type
        const key = `${entity.definition.endpoint.type}:${entity.definition.type}`;
        existingTypes.add(key);
      } else {
        // Endpoint entity: just the type
        const key = `endpoint:${entity.definition.type}`;
        existingTypes.add(key);
      }
    }
  });

  const mockEntities = generateMockTestEntities();

  // Filter out entities that are already registered
  return mockEntities.filter(entity => {
    if ('definition' in entity && entity.definition) {
      if ('endpoint' in entity.definition && entity.definition.endpoint) {
        const key = `${entity.definition.endpoint.type}:${entity.definition.type}`;
        return !existingTypes.has(key);
      } else {
        const key = `endpoint:${entity.definition.type}`;
        return !existingTypes.has(key);
      }
    }
    return true;
  });
}
