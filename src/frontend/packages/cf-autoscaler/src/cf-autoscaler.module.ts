import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { of } from 'rxjs';

import { CoreModule } from '../../core/src/core/core.module';
import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { AutoscalerModule } from './core/autoscaler.module';
import { AutoscalerTabExtensionComponent } from './features/autoscaler-tab-extension/autoscaler-tab-extension.component';

const customRoutes: Routes = [
  {
    path: 'autoscaler',
    loadChildren: './core/autoscaler.module#AutoscalerModule',
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
    AutoscalerModule,
    RouterModule.forRoot(customRoutes),
  ],
  declarations: [
    AutoscalerTabExtensionComponent
  ],
  entryComponents: [AutoscalerTabExtensionComponent]
})
export class CfAutoscalerModule { }
