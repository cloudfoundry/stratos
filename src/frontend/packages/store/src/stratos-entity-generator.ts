import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { stratosEntityCatalog } from './stratos-entity-catalog';

export function generateStratosEntities(): StratosBaseCatalogEntity[] {
  return [
    generateMetricsEndpoint(),
  ];
}

function generateMetricsEndpoint() {
  // TODO: metrics location to be sorted - STRAT-152
  stratosEntityCatalog.metricsEndpoint = new StratosCatalogEndpointEntity({
    type: 'metrics',
    label: 'Metrics',
    labelPlural: 'Metrics',
    tokenSharing: true,
    logoUrl: '/core/assets/endpoint-icons/metrics.svg',
    authTypes: [],
    renderPriority: 1
  },
    entity => `/endpoints/metrics/${entity.endpointId}`
  );
  return stratosEntityCatalog.metricsEndpoint;
}

