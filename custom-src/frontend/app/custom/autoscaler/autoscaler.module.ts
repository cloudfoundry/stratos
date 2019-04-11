import { NgModule } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { AutoscalerRoutingModule } from './autoscaler.routing';
import { AutoscalerBaseComponent } from './autoscaler-base.component';
import { EditAutoscalerPolicyComponent } from './edit-autoscaler-policy/edit-autoscaler-policy.component';
import { ApplicationService } from '../../features/applications/application.service';
import { AutoscalerMetricPageComponent } from './autoscaler-metric-page/autoscaler-metric-page.component';
import { AutoscalerScaleHistoryPageComponent } from './autoscaler-scale-history-page/autoscaler-scale-history-page.component';
import {
  EditAutoscalerPolicyStep1Component
} from './edit-autoscaler-policy/edit-autoscaler-policy-step1/edit-autoscaler-policy-step1.component';
import {
  EditAutoscalerPolicyStep2Component
} from './edit-autoscaler-policy/edit-autoscaler-policy-step2/edit-autoscaler-policy-step2.component';
import {
  EditAutoscalerPolicyStep3Component
} from './edit-autoscaler-policy/edit-autoscaler-policy-step3/edit-autoscaler-policy-step3.component';
import {
  EditAutoscalerPolicyStep4Component
} from './edit-autoscaler-policy/edit-autoscaler-policy-step4/edit-autoscaler-policy-step4.component';
import { CardAutoscalerDefaultComponent } from './card-autoscaler-default/card-autoscaler-default.component';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    AutoscalerRoutingModule,
    NgxChartsModule
  ],
  declarations: [
    AutoscalerBaseComponent,
    AutoscalerMetricPageComponent,
    AutoscalerScaleHistoryPageComponent,
    EditAutoscalerPolicyComponent,
    EditAutoscalerPolicyStep1Component,
    EditAutoscalerPolicyStep2Component,
    EditAutoscalerPolicyStep3Component,
    EditAutoscalerPolicyStep4Component,
    CardAutoscalerDefaultComponent
  ],
  exports: [
    CardAutoscalerDefaultComponent
  ],
  providers: [
    ApplicationService
  ]
})
export class AutoscalerModule { }
