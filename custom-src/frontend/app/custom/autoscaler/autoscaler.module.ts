import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { CoreModule } from '../../core/core.module';
import { ApplicationService } from '../../features/applications/application.service';
import { SharedModule } from '../../shared/shared.module';
import { AutoscalerBaseComponent } from './autoscaler-base.component';
import { AutoscalerMetricPageComponent } from './autoscaler-metric-page/autoscaler-metric-page.component';
import {
  AutoscalerScaleHistoryPageComponent,
} from './autoscaler-scale-history-page/autoscaler-scale-history-page.component';
import { AutoscalerEffects } from './autoscaler.effects';
import { AutoscalerRoutingModule } from './autoscaler.routing';
import { AutoscalerStoreModule } from './autoscaler.store.module';
import { CardAutoscalerDefaultComponent } from './card-autoscaler-default/card-autoscaler-default.component';
import {
  EditAutoscalerPolicyStep1Component,
} from './edit-autoscaler-policy/edit-autoscaler-policy-step1/edit-autoscaler-policy-step1.component';
import {
  EditAutoscalerPolicyStep2Component,
} from './edit-autoscaler-policy/edit-autoscaler-policy-step2/edit-autoscaler-policy-step2.component';
import {
  EditAutoscalerPolicyStep3Component,
} from './edit-autoscaler-policy/edit-autoscaler-policy-step3/edit-autoscaler-policy-step3.component';
import {
  EditAutoscalerPolicyStep4Component,
} from './edit-autoscaler-policy/edit-autoscaler-policy-step4/edit-autoscaler-policy-step4.component';
import { EditAutoscalerPolicyComponent } from './edit-autoscaler-policy/edit-autoscaler-policy.component';
import {
  TableCellAutoscalerEventChangeIconPipe,
} from './list/list-types/app-autoscaler-event/table-cell-autoscaler-event-change/table-cell-autoscaler-event-change-icon.pipe';
import {
  TableCellAutoscalerEventChangeComponent,
} from './list/list-types/app-autoscaler-event/table-cell-autoscaler-event-change/table-cell-autoscaler-event-change.component';
import {
  TableCellAutoscalerEventStatusIconPipe,
} from './list/list-types/app-autoscaler-event/table-cell-autoscaler-event-status/table-cell-autoscaler-event-status-icon.pipe';
import {
  TableCellAutoscalerEventStatusComponent,
} from './list/list-types/app-autoscaler-event/table-cell-autoscaler-event-status/table-cell-autoscaler-event-status.component';
import {
  AppAutoscalerMetricChartCardComponent,
} from './list/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/app-autoscaler-metric-chart-card.component';
import {
  AppAutoscalerComboChartComponent,
} from './list/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/combo-chart/combo-chart.component';
import {
  AppAutoscalerComboSeriesVerticalComponent,
} from './list/list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/combo-chart/combo-series-vertical.component';

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    AutoscalerRoutingModule,
    AutoscalerStoreModule,
    NgxChartsModule,
    EffectsModule.forFeature([
      AutoscalerEffects
    ])
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
    CardAutoscalerDefaultComponent,
    TableCellAutoscalerEventStatusIconPipe,
    TableCellAutoscalerEventChangeIconPipe
  ],
  exports: [
    CardAutoscalerDefaultComponent
  ],
  providers: [
    ApplicationService
  ],
  entryComponents: [
    AppAutoscalerMetricChartCardComponent,
    AppAutoscalerComboChartComponent,
    AppAutoscalerComboSeriesVerticalComponent,
    TableCellAutoscalerEventChangeComponent,
    TableCellAutoscalerEventStatusComponent
  ]
})
export class AutoscalerModule { }
