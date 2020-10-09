import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, first, map } from 'rxjs/operators';

import { IListAction } from '../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../store/src/app-state';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { StratosEndpointExtensionDefinition } from '../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel } from '../../../store/src/public-api';
import { stratosEntityCatalog } from '../../../store/src/stratos-entity-catalog';
import { IFavoriteMetadata } from '../../../store/src/types/user-favorites.types';
import { helmEntityCatalog } from './helm-entity-catalog';
import {
  HELM_ENDPOINT_TYPE,
  HELM_HUB_ENDPOINT_TYPE,
  HELM_REPO_ENDPOINT_TYPE,
  helmEntityFactory,
  helmVersionsEntityType,
  monocularChartsEntityType,
  monocularChartVersionsEntityType,
} from './helm-entity-factory';
import { HelmHubRegistrationComponent } from './helm-hub-registration/helm-hub-registration.component';
import {
  HelmChartActionBuilders,
  helmChartActionBuilders,
  HelmChartVersionsActionBuilders,
  helmChartVersionsActionBuilders,
  HelmVersionActionBuilders,
  helmVersionActionBuilders,
} from './store/helm.action-builders';
import { HelmVersion, MonocularChart, MonocularVersion } from './store/helm.types';


export function generateHelmEntities(): StratosBaseCatalogEntity[] {
  const helmRepoRenderPriority = 10;
  const endpointDefinition: StratosEndpointExtensionDefinition = {
    type: HELM_ENDPOINT_TYPE,
    logoUrl: '/core/assets/custom/helm.svg',
    authTypes: [],
    registeredLimit: 0,
    icon: 'helm',
    iconFont: 'stratos-icons',
    label: 'Helm',
    labelPlural: 'Helms',
    subTypes: [
      {
        type: HELM_REPO_ENDPOINT_TYPE,
        label: 'Helm Repository',
        labelPlural: 'Helm Repositories',
        logoUrl: '/core/assets/custom/helm.svg',
        urlValidation: undefined,
        unConnectable: true,
        techPreview: false,
        authTypes: [],
        endpointListActions: (store: Store<AppState>): IListAction<EndpointModel>[] => {
          return [{
            action: (item: EndpointModel) => {
              helmEntityCatalog.chart.api.synchronise(item).pipe(
                catchError(() => null), // Be super safe to ensure we pass the first filter
                first()
              ).subscribe(res => {
                if (res != null) {
                  stratosEntityCatalog.endpoint.api.getAll();
                }
              });
            },
            label: 'Synchronize',
            description: '',
            createVisible: row => row.pipe(
              map(item => item.cnsi_type === HELM_ENDPOINT_TYPE && item.sub_type === HELM_REPO_ENDPOINT_TYPE)
            ),
            createEnabled: () => of(true)
          }];
        },
        renderPriority: helmRepoRenderPriority,
        registeredLimit: null,
      },
      {
        type: HELM_HUB_ENDPOINT_TYPE,
        label: 'Artifact Hub',
        labelPlural: 'Artifact Hubs',
        authTypes: [],
        unConnectable: true,
        logoUrl: '/core/assets/custom/helm.svg',
        renderPriority: helmRepoRenderPriority + 1,
        registrationComponent: HelmHubRegistrationComponent,
        registeredLimit: 1,
      },
    ],
  };

  return [
    generateEndpointEntity(endpointDefinition),
    generateChartEntity(endpointDefinition),
    generateVersionEntity(endpointDefinition),
    generateChartVersionsEntity(endpointDefinition),
  ];
}

function generateEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  helmEntityCatalog.endpoint = new StratosCatalogEndpointEntity(
    endpointDefinition,
    metadata => `/monocular/charts`,
  );
  return helmEntityCatalog.endpoint;
}

function generateChartEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: monocularChartsEntityType,
    schema: helmEntityFactory(monocularChartsEntityType),
    endpoint: endpointDefinition
  };
  helmEntityCatalog.chart = new StratosCatalogEntity<IFavoriteMetadata, MonocularChart, HelmChartActionBuilders>(
    definition,
    {
      actionBuilders: helmChartActionBuilders
    }
  );
  return helmEntityCatalog.chart;
}

function generateVersionEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: helmVersionsEntityType,
    schema: helmEntityFactory(helmVersionsEntityType),
    endpoint: endpointDefinition
  };
  helmEntityCatalog.version = new StratosCatalogEntity<IFavoriteMetadata, HelmVersion, HelmVersionActionBuilders>(
    definition,
    {
      actionBuilders: helmVersionActionBuilders
    }
  );
  return helmEntityCatalog.version;
}

function generateChartVersionsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: monocularChartVersionsEntityType,
    schema: helmEntityFactory(monocularChartVersionsEntityType),
    endpoint: endpointDefinition
  };
  helmEntityCatalog.chartVersions = new StratosCatalogEntity<IFavoriteMetadata, MonocularVersion[], HelmChartVersionsActionBuilders>(
    definition,
    {
      actionBuilders: helmChartVersionsActionBuilders
    }
  );
  return helmEntityCatalog.chartVersions;
}


