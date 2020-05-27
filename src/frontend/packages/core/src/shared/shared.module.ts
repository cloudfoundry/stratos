import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { InternalEventMonitorFactory } from '../../../store/src/monitors/internal-event-monitor.factory';
import { CoreModule } from '../core/core.module';
import { AppActionMonitorIconComponent } from './components/app-action-monitor-icon/app-action-monitor-icon.component';
import { AppActionMonitorComponent } from './components/app-action-monitor/app-action-monitor.component';
import {
  ApplicationStateIconComponent,
} from './components/application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from './components/application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from './components/application-state/application-state.component';
import { BlurDirective } from './components/blur.directive';
import { BooleanIndicatorComponent } from './components/boolean-indicator/boolean-indicator.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { CardProgressOverlayComponent } from './components/card-progress-overlay/card-progress-overlay.component';
import { CardBooleanMetricComponent } from './components/cards/card-boolean-metric/card-boolean-metric.component';
import { CardNumberMetricComponent } from './components/cards/card-number-metric/card-number-metric.component';
import { CardStatusComponent } from './components/cards/card-status/card-status.component';
import { AppChipsComponent } from './components/chips/chips.component';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { ConfirmationDialogService } from './components/confirmation-dialog.service';
import { CopyToClipboardComponent } from './components/copy-to-clipboard/copy-to-clipboard.component';
import { DateTimeComponent } from './components/date-time/date-time.component';
import { DetailsCardComponent } from './components/details-card/details-card.component';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { DialogErrorComponent } from './components/dialog-error/dialog-error.component';
import { DisplayValueComponent } from './components/display-value/display-value.component';
import { EditableDisplayValueComponent } from './components/editable-display-value/editable-display-value.component';
import { EndpointsMissingComponent } from './components/endpoints-missing/endpoints-missing.component';
import { EntitySummaryTitleComponent } from './components/entity-summary-title/entity-summary-title.component';
import { EnumerateComponent } from './components/enumerate/enumerate.component';
import { FavoritesEntityListComponent } from './components/favorites-entity-list/favorites-entity-list.component';
import { FavoritesGlobalListComponent } from './components/favorites-global-list/favorites-global-list.component';
import { FavoritesMetaCardComponent } from './components/favorites-meta-card/favorites-meta-card.component';
import { FileInputComponent } from './components/file-input/file-input.component';
import { FocusDirective } from './components/focus.directive';
import { IntroScreenComponent } from './components/intro-screen/intro-screen.component';
import { JsonViewerComponent } from './components/json-viewer/json-viewer.component';
import { listCardComponents } from './components/list/list-cards/card.types';
import { MetaCardComponent } from './components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from './components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from './components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from './components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from './components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import {
  TableCellRequestMonitorIconComponent,
} from './components/list/list-table/table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';
import {
  TableCellSidePanelComponent,
} from './components/list/list-table/table-cell-side-panel/table-cell-side-panel.component';
import { TableCellStatusDirective } from './components/list/list-table/table-cell-status.directive';
import { TableComponent } from './components/list/list-table/table.component';
import { listTableComponents } from './components/list/list-table/table.types';
import { EndpointCardComponent } from './components/list/list-types/endpoint/endpoint-card/endpoint-card.component';
import { EndpointListHelper } from './components/list/list-types/endpoint/endpoint-list.helpers';
import { EndpointsListConfigService } from './components/list/list-types/endpoint/endpoints-list-config.service';
import {
  TableCellEndpointNameComponent,
} from './components/list/list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component';
import { ListComponent } from './components/list/list.component';
import { ListConfig } from './components/list/list.component.types';
import { MaxListMessageComponent } from './components/list/max-list-message/max-list-message.component';
import { ListHostDirective } from './components/list/simple-list/list-host.directive';
import { SimpleListComponent } from './components/list/simple-list/simple-list.component';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { MarkdownContentObserverDirective } from './components/markdown-preview/markdown-content-observer.directive';
import { MarkdownPreviewComponent } from './components/markdown-preview/markdown-preview.component';
import { MetadataItemComponent } from './components/metadata-item/metadata-item.component';
import { MetricsChartComponent } from './components/metrics-chart/metrics-chart.component';
import {
  MetricsParentRangeSelectorComponent,
} from './components/metrics-parent-range-selector/metrics-parent-range-selector.component';
import { MetricsRangeSelectorComponent } from './components/metrics-range-selector/metrics-range-selector.component';
import { MultilineTitleComponent } from './components/multiline-title/multiline-title.component';
import { NestedTabsComponent } from './components/nested-tabs/nested-tabs.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { PageSubNavSectionComponent } from './components/page-sub-nav-section/page-sub-nav-section.component';
import { PageSubNavComponent } from './components/page-sub-nav/page-sub-nav.component';
import { PollingIndicatorComponent } from './components/polling-indicator/polling-indicator.component';
import { RingChartComponent } from './components/ring-chart/ring-chart.component';
import { RoutingIndicatorComponent } from './components/routing-indicator/routing-indicator.component';
import { SidepanelPreviewComponent } from './components/sidepanel-preview/sidepanel-preview.component';
import { SimpleUsageChartComponent } from './components/simple-usage-chart/simple-usage-chart.component';
import { SnackBarReturnComponent } from './components/snackbar-return/snackbar-return.component';
import { SshViewerComponent } from './components/ssh-viewer/ssh-viewer.component';
import {
  StackedInputActionComponent,
} from './components/stacked-input-actions/stacked-input-action/stacked-input-action.component';
import { StackedInputActionsComponent } from './components/stacked-input-actions/stacked-input-actions.component';
import { StartEndDateComponent } from './components/start-end-date/start-end-date.component';
import { SteppersModule } from './components/stepper/steppers.module';
import { StratosTitleComponent } from './components/stratos-title/stratos-title.component';
import { TileSelectorTileComponent } from './components/tile-selector-tile/tile-selector-tile.component';
import { TileSelectorComponent } from './components/tile-selector/tile-selector.component';
import { TileGridComponent } from './components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from './components/tile/tile-group/tile-group.component';
import { TileComponent } from './components/tile/tile/tile.component';
import { UniqueDirective } from './components/unique.directive';
import { UnlimitedInputComponent } from './components/unlimited-input/unlimited-input.component';
import {
  UploadProgressIndicatorComponent,
} from './components/upload-progress-indicator/upload-progress-indicator.component';
import { UsageGaugeComponent } from './components/usage-gauge/usage-gauge.component';
import { UserProfileBannerComponent } from './components/user-profile-banner/user-profile-banner.component';
import { CapitalizeFirstPipe } from './pipes/capitalizeFirstLetter.pipe';
import { MbToHumanSizePipe } from './pipes/mb-to-human-size.pipe';
import { PercentagePipe } from './pipes/percentage.pipe';
import { UptimePipe } from './pipes/uptime.pipe';
import { UsageBytesPipe } from './pipes/usage-bytes.pipe';
import { ValuesPipe } from './pipes/values.pipe';
import { LongRunningOperationsService } from './services/long-running-op.service';
import { MetricsRangeSelectorService } from './services/metrics-range-selector.service';
import { UserPermissionDirective } from './user-permission.directive';


@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    PageHeaderModule,
    RouterModule,
    SteppersModule,
    CdkTableModule,
    NgxChartsModule,
  ],
  declarations: [
    LoadingPageComponent,
    DisplayValueComponent,
    EditableDisplayValueComponent,
    MbToHumanSizePipe,
    PercentagePipe,
    UptimePipe,
    UsageBytesPipe,
    ValuesPipe,
    LoadingPageComponent,
    DetailsCardComponent,
    FocusDirective,
    BlurDirective,
    UniqueDirective,
    CodeBlockComponent,
    LogViewerComponent,
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
    DialogConfirmComponent,
    ListComponent,
    ...listCardComponents,
    ...listTableComponents,
    FileInputComponent,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    NestedTabsComponent,
    BooleanIndicatorComponent,
    AppChipsComponent,
    CardBooleanMetricComponent,
    CardNumberMetricComponent,
    RingChartComponent,
    MetricsChartComponent,
    StratosTitleComponent,
    IntroScreenComponent,
    EnumerateComponent,
    UploadProgressIndicatorComponent,
    UserProfileBannerComponent,
    AppActionMonitorComponent,
    AppActionMonitorIconComponent,
    UserProfileBannerComponent,
    TableCellRequestMonitorIconComponent,
    UserPermissionDirective,
    CapitalizeFirstPipe,
    RoutingIndicatorComponent,
    DateTimeComponent,
    StartEndDateComponent,
    MetricsRangeSelectorComponent,
    MetricsParentRangeSelectorComponent,
    StackedInputActionsComponent,
    StackedInputActionComponent,
    FavoritesGlobalListComponent,
    FavoritesMetaCardComponent,
    FavoritesEntityListComponent,
    MultilineTitleComponent,
    TileSelectorComponent,
    MarkdownPreviewComponent,
    MarkdownContentObserverDirective,
    EndpointCardComponent,
    SimpleUsageChartComponent,
    PageSubNavComponent,
    BreadcrumbsComponent,
    PageSubNavSectionComponent,
    EntitySummaryTitleComponent,
    MarkdownPreviewComponent,
    MarkdownContentObserverDirective,
    SnackBarReturnComponent,
    PollingIndicatorComponent,
    UnlimitedInputComponent,
    JsonViewerComponent,
    SimpleListComponent,
    ListHostDirective,
    CopyToClipboardComponent,
    SidepanelPreviewComponent,
    TileSelectorTileComponent,
    SidepanelPreviewComponent,
    TableCellSidePanelComponent,
    CardProgressOverlayComponent,
    MaxListMessageComponent,
  ],
  exports: [
    ApplicationStateIconPipe,
    ApplicationStateIconComponent,
    TableCellStatusDirective,
    FormsModule,
    ReactiveFormsModule,
    LoadingPageComponent,
    DialogErrorComponent,
    PageHeaderModule,
    DisplayValueComponent,
    EditableDisplayValueComponent,
    DetailsCardComponent,
    SteppersModule,
    MbToHumanSizePipe,
    ValuesPipe,
    PercentagePipe,
    UsageBytesPipe,
    UptimePipe,
    SteppersModule,
    FocusDirective,
    BlurDirective,
    UniqueDirective,
    CodeBlockComponent,
    LogViewerComponent,
    EndpointsMissingComponent,
    ApplicationStateComponent,
    SshViewerComponent,
    TileComponent,
    TileGroupComponent,
    TileGridComponent,
    CardStatusComponent,
    MetadataItemComponent,
    UsageGaugeComponent,
    DialogConfirmComponent,
    ListComponent,
    FileInputComponent,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    NestedTabsComponent,
    RingChartComponent,
    AppChipsComponent,
    CardBooleanMetricComponent,
    CardNumberMetricComponent,
    MetricsChartComponent,
    StratosTitleComponent,
    IntroScreenComponent,
    UserProfileBannerComponent,
    EnumerateComponent,
    UploadProgressIndicatorComponent,
    AppActionMonitorComponent,
    AppActionMonitorIconComponent,
    UserPermissionDirective,
    BooleanIndicatorComponent,
    TableComponent,
    UserPermissionDirective,
    CapitalizeFirstPipe,
    RoutingIndicatorComponent,
    DateTimeComponent,
    StartEndDateComponent,
    MetricsRangeSelectorComponent,
    MetricsParentRangeSelectorComponent,
    StackedInputActionsComponent,
    StackedInputActionComponent,
    FavoritesMetaCardComponent,
    FavoritesGlobalListComponent,
    MultilineTitleComponent,
    PageSubNavComponent,
    BreadcrumbsComponent,
    PageSubNavSectionComponent,
    TileSelectorComponent,
    MarkdownPreviewComponent,
    MarkdownContentObserverDirective,
    SimpleUsageChartComponent,
    EntitySummaryTitleComponent,
    MarkdownPreviewComponent,
    MarkdownContentObserverDirective,
    PollingIndicatorComponent,
    UnlimitedInputComponent,
    JsonViewerComponent,
    SimpleListComponent,
    ListHostDirective,
    CopyToClipboardComponent,
    SidepanelPreviewComponent,
    TileSelectorTileComponent,
    SidepanelPreviewComponent,
    TableCellEndpointNameComponent,
    CardProgressOverlayComponent,
    MaxListMessageComponent
  ],
  entryComponents: [
    DialogConfirmComponent,
    SnackBarReturnComponent,
    MarkdownPreviewComponent,
  ],
  providers: [
    ListConfig,
    EndpointListHelper,
    EndpointsListConfigService,
    ConfirmationDialogService,
    InternalEventMonitorFactory,
    MetricsRangeSelectorService,
    LongRunningOperationsService,
  ]
})
export class SharedModule { }
