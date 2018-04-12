/* tslint:disable:max-line-length */
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { VirtualScrollModule } from 'angular2-virtual-scroll';

import { CoreModule } from '../core/core.module';
import {
  ApplicationInstanceChartComponent,
} from '../features/applications/application/application-instance-chart/application-instance-chart.component';
import {
  ApplicationStateIconComponent,
} from './components/application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from './components/application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from './components/application-state/application-state.component';
import { ApplicationStateService } from './components/application-state/application-state.service';
import { BooleanIndicatorComponent } from './components/boolean-indicator/boolean-indicator.component';
import { CardAppInstancesComponent } from './components/cards/card-app-instances/card-app-instances.component';
import { CardAppStatusComponent } from './components/cards/card-app-status/card-app-status.component';
import { CardAppUptimeComponent } from './components/cards/card-app-uptime/card-app-uptime.component';
import { CardAppUsageComponent } from './components/cards/card-app-usage/card-app-usage.component';
import { CardCfInfoComponent } from './components/cards/card-cf-info/card-cf-info.component';
import { CardCfOrgUsageComponent } from './components/cards/card-cf-org-usage/card-cf-org-usage.component';
import {
  CardCfOrgUserDetailsComponent,
} from './components/cards/card-cf-org-user-details/card-cf-org-user-details.component';
import { CardCfSpaceDetailsComponent } from './components/cards/card-cf-space-details/card-cf-space-details.component';
import { CardCfUsageComponent } from './components/cards/card-cf-usage/card-cf-usage.component';
import { CardCfUserInfoComponent } from './components/cards/card-cf-user-info/card-cf-user-info.component';
import { CardStatusComponent } from './components/cards/card-status/card-status.component';
import { CfAuthModule } from './components/cf-auth/cf-auth.module';
import { AppChipsComponent } from './components/chips/chips.component';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { ConfirmationDialogService } from './components/confirmation-dialog.service';
import { DetailsCardComponent } from './components/details-card/details-card.component';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { DialogErrorComponent } from './components/dialog-error/dialog-error.component';
import { DisplayValueComponent } from './components/display-value/display-value.component';
import { EditableDisplayValueComponent } from './components/editable-display-value/editable-display-value.component';
import { EndpointsMissingComponent } from './components/endpoints-missing/endpoints-missing.component';
import { EnvVarViewComponent } from './components/env-var-view/env-var-view.component';
import { FileInputComponent } from './components/file-input/file-input.component';
import { FocusDirective } from './components/focus.directive';
import { listCardComponents } from './components/list/list-cards/card.types';
import {
  AppEventDetailDialogComponentComponent,
} from './components/list/list-cards/custom-cards/card-app-event/app-event-detail-dialog-component/app-event-detail-dialog-component.component';
import { MetaCardComponent } from './components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from './components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from './components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from './components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from './components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { listTableComponents } from './components/list/list-table/table.types';
import {
  EventTabActorIconPipe,
} from './components/list/list-types/app-event/table-cell-event-action/event-tab-actor-icon.pipe';
import { ListComponent } from './components/list/list.component';
import { ListConfig } from './components/list/list.component.types';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { MetadataItemComponent } from './components/metadata-item/metadata-item.component';
import { MetricsChartComponent } from './components/metrics-chart/metrics-chart.component';
import { NestedTabsComponent } from './components/nested-tabs/nested-tabs.component';
import { NoContentMessageComponent } from './components/no-content-message/no-content-message.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { PageSubheaderComponent } from './components/page-subheader/page-subheader.component';
import { RingChartComponent } from './components/ring-chart/ring-chart.component';
import { RunningInstancesComponent } from './components/running-instances/running-instances.component';
import { ServiceIconComponent } from './components/service-icon/service-icon.component';
import { SshViewerComponent } from './components/ssh-viewer/ssh-viewer.component';
import { StatefulIconComponent } from './components/stateful-icon/stateful-icon.component';
import { SteppersModule } from './components/stepper/steppers.module';
import { TileGridComponent } from './components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from './components/tile/tile-group/tile-group.component';
import { TileComponent } from './components/tile/tile/tile.component';
import { UniqueDirective } from './components/unique.directive';
import { UsageGaugeComponent } from './components/usage-gauge/usage-gauge.component';
import { CfOrgSpaceDataService } from './data-services/cf-org-space-service.service';
import { CfUserService } from './data-services/cf-user.service';
import { EntityMonitorFactory } from './monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from './monitors/pagination-monitor.factory';
import { MbToHumanSizePipe } from './pipes/mb-to-human-size.pipe';
import { PercentagePipe } from './pipes/percentage.pipe';
import { UptimePipe } from './pipes/uptime.pipe';
import { UsageBytesPipe } from './pipes/usage-bytes.pipe';
import { ValuesPipe } from './pipes/values.pipe';
import { CardNumberMetricComponent } from './components/cards/card-number-metric/card-number-metric.component';
import { CardCfRecentAppsComponent } from './components/cards/card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from './components/cards/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { StratosTitleComponent } from './components/stratos-title/stratos-title.component';
import { IntroScreenComponent } from './components/intro-screen/intro-screen.component';
import { CloudFoundryService } from './data-services/cloud-foundry.service';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    PageHeaderModule,
    RouterModule,
    SteppersModule,
    VirtualScrollModule,
    CfAuthModule,
    CdkTableModule,
    NgxChartsModule,
  ],
  declarations: [
    LoadingPageComponent,
    DisplayValueComponent,
    StatefulIconComponent,
    EditableDisplayValueComponent,
    MbToHumanSizePipe,
    PercentagePipe,
    UptimePipe,
    UsageBytesPipe,
    ValuesPipe,
    LoadingPageComponent,
    DetailsCardComponent,
    FocusDirective,
    UniqueDirective,
    CodeBlockComponent,
    EventTabActorIconPipe,
    LogViewerComponent,
    AppEventDetailDialogComponentComponent,
    NoContentMessageComponent,
    EndpointsMissingComponent,
    DialogErrorComponent,
    SshViewerComponent,
    ApplicationStateIconPipe,
    ApplicationStateIconComponent,
    ApplicationStateComponent,
    PageSubheaderComponent,
    TileComponent,
    TileGroupComponent,
    TileGridComponent,
    MetadataItemComponent,
    UsageGaugeComponent,
    CardStatusComponent,
    CardAppStatusComponent,
    CardAppInstancesComponent,
    CardAppUsageComponent,
    RunningInstancesComponent,
    DialogConfirmComponent,
    CardAppUptimeComponent,
    ListComponent,
    ...listCardComponents,
    ...listTableComponents,
    CardCfUsageComponent,
    CardCfInfoComponent,
    CardCfUserInfoComponent,
    FileInputComponent,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    NestedTabsComponent,
    CardCfOrgUsageComponent,
    CardCfOrgUserDetailsComponent,
    BooleanIndicatorComponent,
    CardCfSpaceDetailsComponent,
    AppChipsComponent,
    CardNumberMetricComponent,
    CardCfRecentAppsComponent,
    CompactAppCardComponent,
    ServiceIconComponent,
    EnvVarViewComponent,
    RingChartComponent,
    MetricsChartComponent,
    ApplicationInstanceChartComponent,
    StratosTitleComponent,
    IntroScreenComponent
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    LoadingPageComponent,
    DialogErrorComponent,
    PageHeaderModule,
    DisplayValueComponent,
    EditableDisplayValueComponent,
    DetailsCardComponent,
    SteppersModule,
    StatefulIconComponent,
    MbToHumanSizePipe,
    ValuesPipe,
    PercentagePipe,
    UsageBytesPipe,
    UptimePipe,
    SteppersModule,
    FocusDirective,
    UniqueDirective,
    CodeBlockComponent,
    LogViewerComponent,
    NoContentMessageComponent,
    EndpointsMissingComponent,
    ApplicationStateComponent,
    SshViewerComponent,
    PageSubheaderComponent,
    TileComponent,
    TileGroupComponent,
    TileGridComponent,
    CardStatusComponent,
    MetadataItemComponent,
    CardAppStatusComponent,
    CardAppInstancesComponent,
    UsageGaugeComponent,
    CardAppUsageComponent,
    DialogConfirmComponent,
    CardAppUptimeComponent,
    ListComponent,
    CardCfUsageComponent,
    CardCfInfoComponent,
    CardCfUserInfoComponent,
    FileInputComponent,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    NestedTabsComponent,
    CardCfOrgUsageComponent,
    CardCfOrgUserDetailsComponent,
    CardCfSpaceDetailsComponent,
    RingChartComponent,
    AppChipsComponent,
    CardNumberMetricComponent,
    CardCfRecentAppsComponent,
    CompactAppCardComponent,
    EnvVarViewComponent,
    ServiceIconComponent,
    MetricsChartComponent,
    ApplicationInstanceChartComponent,
    StratosTitleComponent,
    IntroScreenComponent
  ],
  entryComponents: [
    AppEventDetailDialogComponentComponent,
    DialogConfirmComponent,
    EnvVarViewComponent
  ],
  providers: [
    ListConfig,
    ApplicationStateService,
    CfOrgSpaceDataService,
    CfUserService,
    ConfirmationDialogService,
    EntityMonitorFactory,
    PaginationMonitorFactory,
    CloudFoundryService
  ]
})
export class SharedModule { }
