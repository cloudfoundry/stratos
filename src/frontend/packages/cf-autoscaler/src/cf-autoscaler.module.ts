import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ExtensionService } from 'frontend/packages/core/src/core/extension/extension-service';

import { CloudFoundrySharedModule } from '../../cloud-foundry/src/shared/cf-shared.module';
import { CoreModule } from '../../core/src/core/core.module';
import { MDAppModule } from '../../core/src/core/md.module';
import { SharedModule } from '../../core/src/shared/shared.module';
import { AutoscalerTabExtensionComponent } from './features/autoscaler-tab-extension/autoscaler-tab-extension.component';


@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    MDAppModule,
    NgxChartsModule,
    CloudFoundrySharedModule,
    ExtensionService.declare([
      AutoscalerTabExtensionComponent,
    ])
  ],
  declarations: [
    AutoscalerTabExtensionComponent
  ]
})
export class CfAutoscalerModule { }
