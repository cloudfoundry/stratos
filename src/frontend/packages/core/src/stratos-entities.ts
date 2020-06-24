import {
  DefaultEndpointCatalogEntity,
  SystemInfoCatalogEntity,
  UserFavoriteCatalogEntity,
  UserProfileCatalogEntity,
} from '../../store/src/base-entity-types';
import { StratosCatalogEndpointEntity } from '../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { BaseEndpointAuth } from './core/endpoint-auth';
import {
  MetricsEndpointDetailsComponent,
} from './features/metrics/metrics-endpoint-details/metrics-endpoint-details.component';

export function generateStratosEntities() {
  return [
    new DefaultEndpointCatalogEntity(),
    new SystemInfoCatalogEntity(),
    new UserFavoriteCatalogEntity(),
    new UserProfileCatalogEntity(),
    // TODO: metrics location to be sorted - STRAT-152
    new StratosCatalogEndpointEntity({
      type: 'metrics',
      label: 'Metrics',
      labelPlural: 'Metrics',
      tokenSharing: true,
      logoUrl: '/core/assets/endpoint-icons/metrics.svg',
      authTypes: [BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.None],
      renderPriority: 1,
      listDetailsComponent: MetricsEndpointDetailsComponent,
    },
      metadata => `/endpoints/metrics/${metadata.guid}`
    )
  ];
}
