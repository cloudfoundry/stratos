/* tslint:disable:max-line-length */
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MomentModule } from 'ngx-moment';
import { MaterialDesignFrameworkModule } from 'stratos-angular6-json-schema-form';

import { CoreModule } from '../core/core.module';
import {
  ApplicationInstanceChartComponent,
} from '../features/applications/application/application-instance-chart/application-instance-chart.component';
import {
  AddServiceInstanceComponent,
} from './components/add-service-instance/add-service-instance/add-service-instance.component';
import { BindAppsStepComponent } from './components/add-service-instance/bind-apps-step/bind-apps-step.component';
import { NoServicePlansComponent } from './components/add-service-instance/no-service-plans/no-service-plans.component';
import { SelectPlanStepComponent } from './components/add-service-instance/select-plan-step/select-plan-step.component';
import { SelectServiceComponent } from './components/add-service-instance/select-service/select-service.component';
import {
  SpecifyDetailsStepComponent,
} from './components/add-service-instance/specify-details-step/specify-details-step.component';
import { AppActionMonitorIconComponent } from './components/app-action-monitor-icon/app-action-monitor-icon.component';
import { AppActionMonitorComponent } from './components/app-action-monitor/app-action-monitor.component';
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
import { CardCfRecentAppsComponent } from './components/cards/card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from './components/cards/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { CardCfSpaceDetailsComponent } from './components/cards/card-cf-space-details/card-cf-space-details.component';
import { CardCfUsageComponent } from './components/cards/card-cf-usage/card-cf-usage.component';
import { CardCfUserInfoComponent } from './components/cards/card-cf-user-info/card-cf-user-info.component';
import { CardNumberMetricComponent } from './components/cards/card-number-metric/card-number-metric.component';
import { CardStatusComponent } from './components/cards/card-status/card-status.component';
import {
  CompactServiceInstanceCardComponent,
} from './components/cards/compact-service-instance-card/compact-service-instance-card.component';
import { ServiceBrokerCardComponent } from './components/cards/service-broker-card/service-broker-card.component';
import {
  ServiceRecentInstancesCardComponent,
} from './components/cards/service-recent-instances-card/service-recent-instances-card.component';
import { ServiceSummaryCardComponent } from './components/cards/service-summary-card/service-summary-card.component';
import { CfAuthModule } from './components/cf-auth/cf-auth.module';
import { CfEndpointsMissingComponent } from './components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CfRoleCheckboxComponent } from './components/cf-role-checkbox/cf-role-checkbox.component';
import { AppChipsComponent } from './components/chips/chips.component';
import { CliCommandComponent } from './components/cli-info/cli-command/cli-command.component';
import { CliInfoComponent } from './components/cli-info/cli-info.component';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { ConfirmationDialogService } from './components/confirmation-dialog.service';
import {
  CreateApplicationStep1Component,
} from './components/create-application/create-application-step1/create-application-step1.component';
import { DateTimeComponent } from './components/date-time/date-time.component';
import { DetailsCardComponent } from './components/details-card/details-card.component';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { DialogErrorComponent } from './components/dialog-error/dialog-error.component';
import { DisplayValueComponent } from './components/display-value/display-value.component';
import { EditableDisplayValueComponent } from './components/editable-display-value/editable-display-value.component';
import { EndpointsMissingComponent } from './components/endpoints-missing/endpoints-missing.component';
import { EnumerateComponent } from './components/enumerate/enumerate.component';
import { EnvVarViewComponent } from './components/env-var-view/env-var-view.component';
import { FileInputComponent } from './components/file-input/file-input.component';
import { FocusDirective } from './components/focus.directive';
import { GithubCommitAuthorComponent } from './components/github-commit-author/github-commit-author.component';
import { IntroScreenComponent } from './components/intro-screen/intro-screen.component';
import { listCardComponents } from './components/list/list-cards/card.types';
import { MetaCardComponent } from './components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from './components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from './components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from './components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from './components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import {
  TableCellRequestMonitorIconComponent,
} from './components/list/list-table/table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';
import { TableComponent } from './components/list/list-table/table.component';
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
import {
  MetricsParentRangeSelectorComponent,
} from './components/metrics-parent-range-selector/metrics-parent-range-selector.component';
import { MetricsRangeSelectorComponent } from './components/metrics-range-selector/metrics-range-selector.component';
import { MultilineTitleComponent } from './components/multiline-title/multiline-title.component';
import { NestedTabsComponent } from './components/nested-tabs/nested-tabs.component';
import { NoContentMessageComponent } from './components/no-content-message/no-content-message.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { RingChartComponent } from './components/ring-chart/ring-chart.component';
import { RoutingIndicatorComponent } from './components/routing-indicator/routing-indicator.component';
import { RunningInstancesComponent } from './components/running-instances/running-instances.component';
import { SchemaFormComponent } from './components/schema-form/schema-form.component';
import { ServiceIconComponent } from './components/service-icon/service-icon.component';
import { ServicePlanPriceComponent } from './components/service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from './components/service-plan-public/service-plan-public.component';
import { SshViewerComponent } from './components/ssh-viewer/ssh-viewer.component';
import { StartEndDateComponent } from './components/start-end-date/start-end-date.component';
import { StatefulIconComponent } from './components/stateful-icon/stateful-icon.component';
import { SteppersModule } from './components/stepper/steppers.module';
import { StratosTitleComponent } from './components/stratos-title/stratos-title.component';
import { TileGridComponent } from './components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from './components/tile/tile-group/tile-group.component';
import { TileComponent } from './components/tile/tile/tile.component';
import { UniqueDirective } from './components/unique.directive';
import {
  UploadProgressIndicatorComponent,
} from './components/upload-progress-indicator/upload-progress-indicator.component';
import { UsageGaugeComponent } from './components/usage-gauge/usage-gauge.component';
import { UserProfileBannerComponent } from './components/user-profile-banner/user-profile-banner.component';
import { CfOrgSpaceDataService } from './data-services/cf-org-space-service.service';
import { CfUserService } from './data-services/cf-user.service';
import { CloudFoundryService } from './data-services/cloud-foundry.service';
import { GitSCMService } from './data-services/scm/scm.service';
import { ServiceActionHelperService } from './data-services/service-action-helper.service';
import { EntityMonitorFactory } from './monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from './monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from './monitors/pagination-monitor.factory';
import { CapitalizeFirstPipe } from './pipes/capitalizeFirstLetter.pipe';
import { MbToHumanSizePipe } from './pipes/mb-to-human-size.pipe';
import { PercentagePipe } from './pipes/percentage.pipe';
import { UptimePipe } from './pipes/uptime.pipe';
import { UsageBytesPipe } from './pipes/usage-bytes.pipe';
import { ValuesPipe } from './pipes/values.pipe';
import { MetricsRangeSelectorService } from './services/metrics-range-selector.service';
import { UserPermissionDirective } from './user-permission.directive';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    PageHeaderModule,
    RouterModule,
    SteppersModule,
    CfAuthModule,
    CdkTableModule,
    NgxChartsModule,
    MaterialDesignFrameworkModule,
    MomentModule,
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
    NoContentMessageComponent,
    EndpointsMissingComponent,
    DialogErrorComponent,
    SshViewerComponent,
    ApplicationStateIconPipe,
    ApplicationStateIconComponent,
    ApplicationStateComponent,
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
    ServicePlanPublicComponent,
    ServicePlanPriceComponent,
    EnvVarViewComponent,
    RingChartComponent,
    MetricsChartComponent,
    ApplicationInstanceChartComponent,
    StratosTitleComponent,
    IntroScreenComponent,
    CliInfoComponent,
    CliCommandComponent,
    CfRoleCheckboxComponent,
    EnumerateComponent,
    UploadProgressIndicatorComponent,
    GithubCommitAuthorComponent,
    UserProfileBannerComponent,
    AppActionMonitorComponent,
    AppActionMonitorIconComponent,
    UserProfileBannerComponent,
    TableCellRequestMonitorIconComponent,
    UserPermissionDirective,
    ServiceSummaryCardComponent,
    ServiceBrokerCardComponent,
    ServiceRecentInstancesCardComponent,
    CompactServiceInstanceCardComponent,
    SpecifyDetailsStepComponent,
    AddServiceInstanceComponent,
    SelectPlanStepComponent,
    SelectServiceComponent,
    NoServicePlansComponent,
    CreateApplicationStep1Component,
    BindAppsStepComponent,
    CfEndpointsMissingComponent,
    CapitalizeFirstPipe,
    RoutingIndicatorComponent,
    SchemaFormComponent,
    DateTimeComponent,
    StartEndDateComponent,
    MetricsRangeSelectorComponent,
    MetricsParentRangeSelectorComponent,
    MultilineTitleComponent,
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
    ServicePlanPublicComponent,
    ServicePlanPriceComponent,
    MetricsChartComponent,
    ApplicationInstanceChartComponent,
    StratosTitleComponent,
    IntroScreenComponent,
    UserProfileBannerComponent,
    CliInfoComponent,
    CliCommandComponent,
    CfRoleCheckboxComponent,
    EnumerateComponent,
    UploadProgressIndicatorComponent,
    GithubCommitAuthorComponent,
    AppActionMonitorComponent,
    CliCommandComponent,
    AppActionMonitorIconComponent,
    UserPermissionDirective,
    BooleanIndicatorComponent,
    ServiceSummaryCardComponent,
    ServiceBrokerCardComponent,
    ServiceRecentInstancesCardComponent,
    CompactServiceInstanceCardComponent,
    TableComponent,
    UserPermissionDirective,
    SpecifyDetailsStepComponent,
    AddServiceInstanceComponent,
    SelectPlanStepComponent,
    SelectServiceComponent,
    CreateApplicationStep1Component,
    BindAppsStepComponent,
    CapitalizeFirstPipe,
    CfEndpointsMissingComponent,
    RoutingIndicatorComponent,
    DateTimeComponent,
    StartEndDateComponent,
    MetricsRangeSelectorComponent,
    MetricsParentRangeSelectorComponent
  ],
  entryComponents: [
    DialogConfirmComponent,
    EnvVarViewComponent,
    NoServicePlansComponent
  ],
  providers: [
    ListConfig,
    ApplicationStateService,
    CfOrgSpaceDataService,
    CfUserService,
    ConfirmationDialogService,
    EntityMonitorFactory,
    PaginationMonitorFactory,
    CloudFoundryService,
    InternalEventMonitorFactory,
    ServiceActionHelperService,
    GitSCMService,
    MetricsRangeSelectorService
  ]
})
export class SharedModule { }
