import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { of } from 'rxjs';

import { CloudFoundrySharedModule } from '../../cloud-foundry/src/shared/cf-shared.module';
import { CoreModule } from '../../core/src/core/core.module';
import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { AutoscalerModule } from './core/autoscaler.module';
import { AutoscalerTabExtensionComponent } from './features/autoscaler-tab-extension/autoscaler-tab-extension.component';
import { generateASEntities } from './store/autoscaler-entity-generator';
import { AutoscalerEffects } from './store/autoscaler.effects';
import { ExtensionService } from 'frontend/packages/core/src/core/extension/extension-service';

// FIXME Work out why we need this and remove it.
const customRoutes: Routes = [
  {
    path: 'autoscaler',
    loadChildren: () => import('./core/autoscaler.module').then(m => m.AutoscalerModule),
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

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    MDAppModule,
    NgxChartsModule,
    CloudFoundrySharedModule,
    AutoscalerModule,
    RouterModule.forRoot(customRoutes),
    EntityCatalogModule.forFeature(generateASEntities),
    EffectsModule.forFeature([
      AutoscalerEffects
    ]),
    ExtensionService.declare([
      AutoscalerTabExtensionComponent,
    ])
  ],
  declarations: [
    AutoscalerTabExtensionComponent
  ]
})
export class CfAutoscalerModule { }
