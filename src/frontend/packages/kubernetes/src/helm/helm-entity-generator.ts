import { Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { take, catchError, filter, map } from 'rxjs/operators';

import { urlValidationExpression } from '../../../core/src/core/utils.service';
import { IListAction } from '../../../core/src/shared/components/signal-list/list-action.types';
import { AppState } from '../../../store/src/app-state';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity } from '../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { StratosEndpointExtensionDefinition } from '../../../store/src/entity-catalog/entity-catalog.types';
import { AuthDataService, EndpointModel, EndpointsDataService, Store } from '../../../store/src/public-api';
import { IFavoriteMetadata } from '../../../store/src/types/user-favorites.types';
import { helmEntityCatalog } from './helm-entity-catalog';
import {
  HELM_ENDPOINT_TYPE,
  HELM_HUB_ENDPOINT_TYPE,
  HELM_REPO_ENDPOINT_TYPE,
  helmEntityFactory,
  helmVersionsEntityType,
  monocularChartsEntityType,
  monocularChartVersionsEntityType } from './helm-entity-factory';
import { HelmHubRegistrationComponent } from './helm-hub-registration/helm-hub-registration.component';
import {
  HelmChartActionBuilders,
  helmChartActionBuilders,
  HelmChartVersionsActionBuilders,
  helmChartVersionsActionBuilders,
  HelmVersionActionBuilders,
  helmVersionActionBuilders } from './store/helm.action-builders';
import { HelmVersion, MonocularChart, MonocularVersion } from './store/helm.types';


export function generateHelmEntities(): StratosBaseCatalogEntity[] {
  const helmRepoRenderPriority = 10;
  const endpointDefinition: StratosEndpointExtensionDefinition = {
    type: HELM_ENDPOINT_TYPE,
    logoUrl: '/kubernetes/assets/custom/helm.svg',
    authTypes: [],
    registeredLimit: () => 0,
    icon: 'helm',
    iconFont: 'stratos-icons',
    label: 'Helm',
    labelPlural: 'Helms',
    urlValidationRegexString: urlValidationExpression,
    subTypes: [
      {
        type: HELM_REPO_ENDPOINT_TYPE,
        label: 'Helm Repository',
        labelPlural: 'Helm Repositories',
        logoUrl: '/kubernetes/assets/custom/helm.svg',
        unConnectable: true,
        techPreview: false,
        authTypes: [],
        endpointListActions: (
          _store: Store<AppState>,
          endpointsService: EndpointsDataService,
        ): IListAction<EndpointModel>[] => {
          return [{
            action: (item: EndpointModel) => {
              helmEntityCatalog.chart.api.synchronise(item).pipe(
                catchError((): Observable<null> => of(null)), // Be super safe to ensure we pass the first filter
                take(1)
              ).subscribe((res: unknown) => {
                if (res != null) {
                  void endpointsService.getAll(false);
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
        registeredLimit: null, // Ensure this is null, otherwise inherits parent's value
      },
      {
        type: HELM_HUB_ENDPOINT_TYPE,
        label: 'Artifact Hub',
        labelPlural: 'Artifact Hubs',
        authTypes: [],
        unConnectable: true,
        logoUrl: '/kubernetes/assets/custom/helm.svg',
        renderPriority: helmRepoRenderPriority + 1,
        registrationComponent: HelmHubRegistrationComponent,
        registeredLimit: (store: Store<AppState>): Observable<number> => {
          // session-data reads route through AuthDataService (signal-native
          // facade) resolved off the framework-passed store's injector.
          const injector = (store as unknown as { injector?: Injector }).injector;
          const authData = injector?.get(AuthDataService, null);
          if (!authData) {
            return of(1);
          }
          return toObservable(authData.sessionData, { injector }).pipe(
            filter(sessionData => !!sessionData?.['plugin-config']),
            map(sessionData => sessionData['plugin-config'].artifactHubDisabled === 'true' ? 0 : 1),
          );
        }
      },
    ] };

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
    () => '/monocular',
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


