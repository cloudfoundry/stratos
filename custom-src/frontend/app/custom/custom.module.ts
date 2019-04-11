import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SharedModule } from '../shared/shared.module';
import { MDAppModule } from '../core/md.module';
import { CoreModule } from '../core/core.module';
import { AutoscalerModule } from './autoscaler/autoscaler.module';
import { AutoscalerTabExtensionComponent } from './autoscaler/autoscaler-tab-extension/autoscaler-tab-extension.component';
// import { CardAutoscalerDefaultComponent } from './autoscaler/card-autoscaler-default/card-autoscaler-default.component';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    MDAppModule,
    NgxChartsModule,
    AutoscalerModule,
  ],
  declarations: [
    AutoscalerTabExtensionComponent,
    // CardAutoscalerDefaultComponent
  ],
  entryComponents: [AutoscalerTabExtensionComponent]
})
export class CustomModule { }
