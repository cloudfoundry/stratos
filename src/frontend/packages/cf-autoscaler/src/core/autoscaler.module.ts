import { DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';

import { ApplicationService } from '../../../cloud-foundry/src/features/applications/application.service';
import {
  ApplicationEnvVarsHelper,
} from '../../../cloud-foundry/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { CloudFoundrySharedModule } from '../../../cloud-foundry/src/shared/cf-shared.module';
import { CoreModule } from '@stratosui/core';
import { SharedModule } from '@stratosui/core';
import { EditAutoscalerCredentialComponent } from '../features/edit-autoscaler-credential/edit-autoscaler-credential.component';
import {
  EditAutoscalerPolicyStep1Component,
} from '../features/edit-autoscaler-policy/edit-autoscaler-policy-step1/edit-autoscaler-policy-step1.component';
import { EditAutoscalerPolicyComponent } from '../features/edit-autoscaler-policy/edit-autoscaler-policy.component';
import {
  TableCellAutoscalerEventChangeIconPipe,
} from '../shared/list-types/app-autoscaler-event/table-cell-autoscaler-event-change/table-cell-autoscaler-event-change-icon.pipe';
import {
  TableCellAutoscalerEventChangeComponent,
} from '../shared/list-types/app-autoscaler-event/table-cell-autoscaler-event-change/table-cell-autoscaler-event-change.component';
import {
  TableCellAutoscalerEventStatusIconPipe,
} from '../shared/list-types/app-autoscaler-event/table-cell-autoscaler-event-status/table-cell-autoscaler-event-status-icon.pipe';
import {
  TableCellAutoscalerEventStatusComponent,
} from '../shared/list-types/app-autoscaler-event/table-cell-autoscaler-event-status/table-cell-autoscaler-event-status.component';
import {
  AppAutoscalerMetricChartCardComponent,
} from '../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/app-autoscaler-metric-chart-card.component';
import {
  AppAutoscalerComboChartComponent,
} from '../shared/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/combo-chart/combo-chart.component';
import { AutoscalerRoutingModule } from './autoscaler.routing';
import {
  EditAutoscalerPolicyStep3Component,
} from '../features/edit-autoscaler-policy/edit-autoscaler-policy-step3/edit-autoscaler-policy-step3.component';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    AutoscalerRoutingModule,
    CloudFoundrySharedModule,
    EditAutoscalerCredentialComponent,
    EditAutoscalerPolicyStep1Component,
    EditAutoscalerPolicyStep3Component,
    AppAutoscalerComboChartComponent,
    AppAutoscalerMetricChartCardComponent,
    EditAutoscalerPolicyComponent,
    TableCellAutoscalerEventChangeComponent,
    TableCellAutoscalerEventStatusComponent,
    TableCellAutoscalerEventStatusIconPipe,
    TableCellAutoscalerEventChangeIconPipe,
  ],
  declarations: [
  ],
  providers: [
    ApplicationService,
    ApplicationEnvVarsHelper,
    DatePipe
  ]
})
export class AutoscalerModule { }
