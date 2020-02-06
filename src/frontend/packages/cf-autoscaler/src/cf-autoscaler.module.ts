import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { of } from 'rxjs';

import { CloudFoundryComponentsModule } from '../../cloud-foundry/src/shared/components/components.module';
import { CoreModule } from '../../core/src/core/core.module';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { AutoscalerModule } from './core/autoscaler.module';
import { AutoscalerTabExtensionComponent } from './features/autoscaler-tab-extension/autoscaler-tab-extension.component';
import { generateASEntities } from './store/autoscaler-entity-generator';
import { AutoscalerEffects } from './store/autoscaler.effects';

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
    CloudFoundryComponentsModule,
    AutoscalerModule,
    RouterModule.forRoot(customRoutes),
    EntityCatalogModule.forFeature(generateASEntities),
    EffectsModule.forFeature([
      AutoscalerEffects
    ])
  ],
  declarations: [
    AutoscalerTabExtensionComponent
  ],
  entryComponents: [AutoscalerTabExtensionComponent]
})
export class CfAutoscalerModule { }
