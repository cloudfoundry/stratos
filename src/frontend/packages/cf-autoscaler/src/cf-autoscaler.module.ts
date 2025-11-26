import { NgModule } from '@angular/core';

import { ExtensionService } from '@stratosui/core';
import { AutoscalerTabExtensionComponent } from './features/autoscaler-tab-extension/autoscaler-tab-extension.component';


@NgModule({
  imports: [
    ExtensionService.declare([
      AutoscalerTabExtensionComponent,
    ])
  ]
})
export class CfAutoscalerModule { }
