import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, first, startWith, switchMap } from 'rxjs/operators';

import { CoreModule } from '../../core/src/core/core.module';
import { StratosExtension } from '../../core/src/core/extension/extension-service';
import { EndpointTypeExtensionConfig } from '../../core/src/core/extension/extension-types';
import { urlValidationExpression } from '../../core/src/core/utils.service';
import { EndpointAuthTypeNames } from '../../core/src/features/endpoints/endpoint-helpers';
import { IListAction } from '../../core/src/shared/components/list/list.component.types';
import { SharedModule } from '../../core/src/shared/shared.module';
import { RouterNav } from '../../store/src/actions/router.actions';
import { AppState } from '../../store/src/app-state';
import { EndpointModel } from '../../store/src/types/endpoint.types';
import { CfEndpointDetailsComponent } from './shared/components/cf-endpoint-details/cf-endpoint-details.component';
import { CloudFoundryComponentsModule } from './shared/components/components.module';
import {
  ContainerOrchestratorStepperComponent,
} from './shared/components/container-orchestrator-stepper/container-orchestrator-stepper.component';
import { canConfigureOrchestrator } from './shared/eirini.helper';

export const cloudFoundryEndpointTypes: EndpointTypeExtensionConfig[] = [{
  type: 'cf',
  label: 'Cloud Foundry',
  urlValidation: urlValidationExpression,
  icon: 'cloud_foundry',
  iconFont: 'stratos-icons',
  imagePath: '/core/assets/endpoint-icons/cloudfoundry.png',
  homeLink: (guid) => ['/cloud-foundry', guid],
  listDetailsComponent: CfEndpointDetailsComponent,
  order: 0,
  authTypes: [EndpointAuthTypeNames.CREDS, EndpointAuthTypeNames.SSO],
  createActions: (store: Store<AppState>): IListAction<EndpointModel>[] => {
    return [
      {
        action: (endpoint) => store.dispatch(new RouterNav({ path: `${endpoint.guid}/eirini` })),
        label: 'Configure',
        createVisible: (row$: Observable<EndpointModel>): Observable<boolean> => row$.pipe(
          filter(row => row.cnsi_type === 'cf'),
          first(),
          switchMap(() => canConfigureOrchestrator(store)),
          startWith(false)
        )
      }
    ];
  }
}];

const customRoutes: Routes = [
  {
    path: ':endpointId/eirini',
    component: ContainerOrchestratorStepperComponent,
    data: {
      stratosNavigation: {
        text: 'Applications',
        matIcon: 'apps',
        position: 20,
        hidden: of(true)
      }
    },
  },
];

@StratosExtension({
  endpointTypes: cloudFoundryEndpointTypes,
})
@NgModule({
  imports: [
    CloudFoundryComponentsModule,
    CoreModule,
    CommonModule,
    SharedModule,
    RouterModule.forRoot(customRoutes),
  ]
})
export class CloudFoundryModule { }
