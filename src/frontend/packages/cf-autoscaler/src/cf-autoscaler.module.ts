import { NgModule } from '@angular/core';

import { ExtensionService } from '../../core/src/core/extension/extension-service';
import { AutoscalerTabExtensionComponent } from './features/autoscaler-tab-extension/autoscaler-tab-extension.component';


@NgModule({
  imports: [
    ExtensionService.declare([
      AutoscalerTabExtensionComponent,
    ])
  ]
})
export class CfAutoscalerModule { }
