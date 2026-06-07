import { EnvironmentInjector, Injector, inject, runInInjectionContext } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { KubeHelmDataService } from '../services/endpoint-data/kube-helm-data.service';

import { urlValidationExpression } from '../../../core/src/core/utils.service';
import { IListAction } from '../../../core/src/shared/components/signal-list/list-action.types';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity } from '../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { StratosEndpointExtensionDefinition } from '../../../store/src/entity-catalog/entity-catalog.types';
import { AuthDataService, EndpointModel, EndpointsDataService } from '../../../store/src/public-api';
import { helmEntityCatalog } from './helm-entity-catalog';
import {
  HELM_ENDPOINT_TYPE,
  HELM_HUB_ENDPOINT_TYPE,
  HELM_REPO_ENDPOINT_TYPE } from './helm-entity-factory';
import { HelmHubRegistrationComponent } from './helm-hub-registration/helm-hub-registration.component';


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
          endpointsService: EndpointsDataService,
          injector: EnvironmentInjector,
        ): IListAction<EndpointModel>[] => {
          return [{
            action: (item: EndpointModel) => {
              // Signal-native synchronise (replaces the orphaned `helmSynchronise$`
              // ngrx effect). Resolve KubeHelmDataService from the injector since
              // this callback runs outside an injection context.
              const helmData = runInInjectionContext(injector, () => inject(KubeHelmDataService));
              void helmData.synchronise(item).then((ok: boolean) => {
                if (ok) {
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
        registeredLimit: (injector: Injector): Observable<number> => {
          // session-data reads route through AuthDataService (signal-native
          // facade) resolved off the framework-passed injector.
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
  ];
}

function generateEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  helmEntityCatalog.endpoint = new StratosCatalogEndpointEntity(
    endpointDefinition,
    () => '/monocular',
  );
  return helmEntityCatalog.endpoint;
}


