// Removed CDK table dependency
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InternalEventMonitorFactory } from '@stratosui/store';
import { BaseChartDirective } from 'ng2-charts';

import { AppActionMonitorIconComponent } from './components/app-action-monitor-icon/app-action-monitor-icon.component';
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
import { CardStatusComponent } from './components/cards/card-status/card-status.component'; // Now standalone
import { AppChipsComponent } from './components/chips/chips.component';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { ConfirmationDialogService } from './components/confirmation-dialog.service';
import { CopyToClipboardComponent } from './components/copy-to-clipboard/copy-to-clipboard.component';
import { DateTimeComponent } from './components/date-time/date-time.component';
import { DetailsCardComponent } from './components/details-card/details-card.component';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { DialogErrorComponent } from './components/dialog-error/dialog-error.component';
import { DisplayValueComponent } from './components/display-value/display-value.component';
import { EditableDisplayValueComponent } from './components/editable-display-value/editable-display-value.component'; // Now standalone
import { EndpointsMissingComponent } from './components/endpoints-missing/endpoints-missing.component'; // Now standalone
import { EntitySummaryTitleComponent } from './components/entity-summary-title/entity-summary-title.component';
import { EnumerateComponent } from './components/enumerate/enumerate.component';
import { FileInputComponent } from './components/file-input/file-input.component'; // Now standalone
import { FocusDirective } from './components/focus.directive';
import { IntroScreenComponent } from './components/intro-screen/intro-screen.component';
import { JsonViewerComponent } from './components/json-viewer/json-viewer.component';
import { MetaCardComponent } from './components/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from './components/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from './components/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from './components/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from './components/meta-card/meta-card-value/meta-card-value.component';
import { EndpointCardComponent } from './components/endpoint-list/endpoint-card/endpoint-card.component';
import { EndpointListHelper } from './components/endpoint-list/endpoint-list.helpers';
import {
  TableCellEndpointNameComponent,
} from './components/endpoint-list/table-cell-endpoint-name/table-cell-endpoint-name.component';
import { TableCellEndpointStatusComponent } from './components/endpoint-list/table-cell-endpoint-status/table-cell-endpoint-status.component';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { MarkdownContentObserverDirective } from './components/markdown-preview/markdown-content-observer.directive';
import { MarkdownPreviewComponent } from './components/markdown-preview/markdown-preview.component';
import { MetadataItemComponent } from './components/metadata-item/metadata-item.component';
import { MetricsChartComponent} from './components/metrics-chart/metrics-chart.component'; // Now standalone
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
import { ProductNameComponent } from './components/product-name.ccomponent';
import { ProfileSettingsComponent } from './components/profile-settings/profile-settings.component';
import { RingChartComponent } from './components/ring-chart/ring-chart.component';
import { RoutingIndicatorComponent } from './components/routing-indicator/routing-indicator.component';
import { SidepanelPreviewComponent } from './components/sidepanel-preview/sidepanel-preview.component';
import { SimpleUsageChartComponent } from './components/simple-usage-chart/simple-usage-chart.component';
import { SnackBarReturnComponent } from './components/snackbar-return/snackbar-return.component';
import { SshViewerComponent } from './components/ssh-viewer/ssh-viewer.component'; // Now standalone
import {
  StackedInputActionComponent,
} from './components/stacked-input-actions/stacked-input-action/stacked-input-action.component'; // Now standalone
import { StackedInputActionsComponent } from './components/stacked-input-actions/stacked-input-actions.component';
import { StartEndDateComponent } from './components/start-end-date/start-end-date.component';
import { SteppersModule } from './components/stepper/steppers.module';
import { StratosTitleComponent } from './components/stratos-title/stratos-title.component'; // Now standalone
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
import { SessionService } from './services/session.service';
import { UserPermissionDirective } from './user-permission.directive';
import { TailwindSortDirective, TailwindSortHeaderDirective, TailwindSortService } from './services/tailwind-sort.service';
import { TailwindSidenavService } from './services/tailwind-sidenav.service';
import { TailwindPaginatorService } from './services/tailwind-paginator.service';
import { TailwindSnackBarService } from './services/tailwind-snackbar.service';
import { TailwindDialogService } from './services/tailwind-dialog.service';
import { TailwindIconRegistry } from './services/tailwind-icon-registry.service';
import { TailwindErrorStateMatcher, TailwindDefaultErrorStateMatcher, TailwindShowOnDirtyErrorStateMatcher } from './services/tailwind-error-state-matcher';
import { TailwindJsonSchemaFormService } from './services/tailwind-json-schema-form.service';
import { CustomExpansionPanelComponent, CustomExpansionPanelHeaderComponent } from './components/custom-expansion-panel/custom-expansion-panel.component';
import { CustomFormFieldComponent, CustomFormFieldIconComponent, CustomIconButtonDirective, CustomButtonDirective, MatInputDirective, MatSuffixDirective } from './components/custom-form-field/custom-form-field.component';
import { CustomCheckboxComponent } from './components/custom-checkbox/custom-checkbox.component';
import { DisableRouterLinkDirective } from '../core/disable-router-link.directive';
import { MatDatepickerDirective } from './components/custom-material/custom-material.component';
import { CustomSlideToggleComponent } from './components/custom-slide-toggle/custom-slide-toggle.component';
import { CustomSelectComponent, CustomOptionComponent } from './components/custom-select/custom-select.component';
import { CustomButtonToggleComponent, CustomButtonToggleGroupComponent } from './components/custom-button-toggle/custom-button-toggle.component';
import { CustomTabGroupComponent, CustomTabComponent } from './components/custom-tabs/custom-tabs.component';
import { CustomCardComponent, CustomCardHeaderComponent, CustomCardTitleComponent, CustomCardSubtitleComponent, CustomCardContentComponent, CustomCardActionsComponent, CustomCardFooterComponent } from './components/custom-card/custom-card.component';
import { CustomTooltipDirective } from './components/custom-tooltip/custom-tooltip.directive';
import { CustomIconComponent, CustomProgressBarSelectorComponent, CustomDialogContentComponent, CustomDialogActionsComponent, CustomDialogTitleComponent, CustomDatepickerComponent, CustomDatepickerInputComponent, CustomDatepickerToggleComponent } from './components/custom-material/custom-material.component'; // CustomProgressBarSelectorComponent now standalone
import { NoContentMessageComponent } from './components/no-content-message/no-content-message.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderModule,
    RouterModule,
    SteppersModule,
    BaseChartDirective,
    // Standalone components
    CopyToClipboardComponent,
    EntitySummaryTitleComponent,
    DateTimeComponent,
    CardProgressOverlayComponent,
    UsageGaugeComponent,
    CodeBlockComponent,
    AppChipsComponent,
    TileSelectorComponent,
    TileSelectorTileComponent,
    DetailsCardComponent,
    CustomCheckboxComponent,
    IntroScreenComponent,
    DisplayValueComponent,
    BooleanIndicatorComponent,
    LoadingPageComponent,
    MetadataItemComponent,
    CardStatusComponent,
    StratosTitleComponent,
    EditableDisplayValueComponent,
    EnumerateComponent,
    UserProfileBannerComponent,
    UserAvatarComponent,
    NoContentMessageComponent,
    SshViewerComponent,
    DialogConfirmComponent,
    DialogErrorComponent,
    LogViewerComponent,
    EndpointsMissingComponent,
    FileInputComponent,
    CustomProgressBarSelectorComponent,
    CustomIconComponent,
    TileComponent,
    TileGroupComponent,
    TileGridComponent, // Now standalone - moved to imports
    ApplicationStateComponent,
    ApplicationStateIconComponent,
    PollingIndicatorComponent, // Now standalone - moved to imports
    MultilineTitleComponent, // Now standalone - moved to imports
    UploadProgressIndicatorComponent, // Now standalone - moved to imports
    NestedTabsComponent, // Now standalone - moved to imports
    CardBooleanMetricComponent, // Now standalone - moved to imports
    CardNumberMetricComponent, // Now standalone - moved to imports
    SnackBarReturnComponent, // Now standalone - moved to imports
    RingChartComponent,
    MetricsChartComponent, // Now standalone - moved to imports
    PageSubNavComponent, // Now standalone - moved to imports
    StartEndDateComponent, // Now standalone - moved to imports
    BreadcrumbsComponent, // Now standalone - moved to imports
    RoutingIndicatorComponent, // Now standalone - moved to imports
    UnlimitedInputComponent, // Now standalone - moved to imports
    PageSubNavSectionComponent, // Now standalone - moved to imports
    SidepanelPreviewComponent, // Now standalone - moved to imports
    MarkdownPreviewComponent, // Now standalone - moved to imports
    MarkdownContentObserverDirective, // Now standalone - moved to imports
    JsonViewerComponent, // Now standalone - moved to imports
    SimpleUsageChartComponent, // Now standalone - moved to imports
    MetricsParentRangeSelectorComponent, // Now standalone - moved to imports
    AppActionMonitorIconComponent, // Now standalone - moved to imports
    MetricsRangeSelectorComponent, // Now standalone - moved to imports
    ProfileSettingsComponent, // Now standalone - moved to imports
    StackedInputActionsComponent, // Now standalone - moved to imports
    StackedInputActionComponent, // Now standalone - moved to imports
    EndpointCardComponent, // Now standalone - moved to imports
    ProductNameComponent, // Now standalone - moved to imports
    // Wave 11 dependency chain - now standalone
    MetaCardComponent, // Now standalone - moved to imports
    MetaCardTitleComponent, // Now standalone - moved to imports
    MetaCardItemComponent, // Now standalone - moved to imports
    MetaCardKeyComponent, // Now standalone - moved to imports
    MetaCardValueComponent, // Now standalone - moved to imports
    DisableRouterLinkDirective, // Now standalone - moved to imports
    TableCellEndpointStatusComponent, // Now standalone - moved to imports
    TableCellEndpointNameComponent, // Now standalone - moved to imports
    // Standalone pipes
    PercentagePipe,
    ApplicationStateIconPipe,
    // === Standalone Pipes ===
    MbToHumanSizePipe,
    UptimePipe,
    UsageBytesPipe,
    ValuesPipe,
    CapitalizeFirstPipe,
    // === Standalone Directives ===
    FocusDirective,
    BlurDirective,
    UniqueDirective,
    UserPermissionDirective,
    TailwindSortDirective,
    TailwindSortHeaderDirective,
    // === Custom Material Wrapper Components ===
    CustomExpansionPanelComponent,
    CustomExpansionPanelHeaderComponent,
    MatInputDirective,
    MatDatepickerDirective,
    CustomFormFieldComponent,
    CustomFormFieldIconComponent,
    CustomIconButtonDirective,
    CustomButtonDirective,
    MatSuffixDirective,
    CustomSlideToggleComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomButtonToggleComponent,
    CustomButtonToggleGroupComponent,
    CustomTabGroupComponent,
    CustomTabComponent,
    CustomCardComponent,
    CustomCardHeaderComponent,
    CustomCardTitleComponent,
    CustomCardSubtitleComponent,
    CustomCardContentComponent,
    CustomCardActionsComponent,
    CustomCardFooterComponent,
    CustomTooltipDirective,
    CustomDialogContentComponent,
    CustomDialogActionsComponent,
    CustomDialogTitleComponent,
    CustomDatepickerComponent,
    CustomDatepickerInputComponent,
    CustomDatepickerToggleComponent,
  ],
  declarations: [
    // All standalone components moved to imports above
  ],
  exports: [
    // === Standalone Pipes (imported above) ===
    ApplicationStateIconPipe,
    MbToHumanSizePipe,
    ValuesPipe,
    PercentagePipe,
    UsageBytesPipe,
    UptimePipe,
    CapitalizeFirstPipe,

    // === Standalone Directives (imported above) ===
    FocusDirective,
    BlurDirective,
    UniqueDirective,
    UserPermissionDirective,
    TailwindSortDirective,
    TailwindSortHeaderDirective,
    DisableRouterLinkDirective,
    CustomIconButtonDirective,
    CustomButtonDirective,
    MatInputDirective,
    MatDatepickerDirective,
    MatSuffixDirective,
    CustomTooltipDirective,
    MarkdownContentObserverDirective,

    // === Modules (can be exported without being in imports) ===
    FormsModule,
    ReactiveFormsModule,
    PageHeaderModule,
    SteppersModule,

    // === Standalone Components (imported above) ===
    ApplicationStateIconComponent,
    ApplicationStateComponent,
    LoadingPageComponent,
    DialogErrorComponent,
    DialogConfirmComponent,
    DisplayValueComponent,
    EditableDisplayValueComponent,
    EnumerateComponent,
    UserProfileBannerComponent,
    UserAvatarComponent,
    DetailsCardComponent,
    CodeBlockComponent,
    LogViewerComponent,
    EndpointsMissingComponent,
    SshViewerComponent,
    TileComponent,
    TileGroupComponent,
    TileGridComponent,
    CardStatusComponent,
    CardBooleanMetricComponent,
    CardNumberMetricComponent,
    MetadataItemComponent,
    UsageGaugeComponent,
    SnackBarReturnComponent,
    FileInputComponent,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    RingChartComponent,
    AppChipsComponent,
    MetricsChartComponent,
    StratosTitleComponent,
    IntroScreenComponent,
    UploadProgressIndicatorComponent,
    AppActionMonitorIconComponent,
    BooleanIndicatorComponent,
    RoutingIndicatorComponent,
    DateTimeComponent,
    StartEndDateComponent,
    MetricsRangeSelectorComponent,
    MetricsParentRangeSelectorComponent,
    StackedInputActionComponent,
    StackedInputActionsComponent,
    PageSubNavComponent,
    PageSubNavSectionComponent,
    BreadcrumbsComponent,
    TileSelectorComponent,
    TileSelectorTileComponent,
    MarkdownPreviewComponent,
    SimpleUsageChartComponent,
    EntitySummaryTitleComponent,
    PollingIndicatorComponent,
    UnlimitedInputComponent,
    JsonViewerComponent,
    CopyToClipboardComponent,
    SidepanelPreviewComponent,
    TableCellEndpointNameComponent,
    EndpointCardComponent,
    CardProgressOverlayComponent,
    ProfileSettingsComponent,
    ProductNameComponent,
    NoContentMessageComponent,

    // === Custom Material Wrapper Components ===
    CustomExpansionPanelComponent,
    CustomExpansionPanelHeaderComponent,
    CustomCheckboxComponent,
    CustomFormFieldComponent,
    CustomFormFieldIconComponent,
    CustomIconComponent,
    CustomProgressBarSelectorComponent,
    CustomSlideToggleComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomButtonToggleComponent,
    CustomButtonToggleGroupComponent,
    CustomTabGroupComponent,
    CustomTabComponent,
    CustomCardComponent,
    CustomCardHeaderComponent,
    CustomCardTitleComponent,
    CustomCardSubtitleComponent,
    CustomCardContentComponent,
    CustomCardActionsComponent,
    CustomCardFooterComponent,
    CustomDialogContentComponent,
    CustomDialogActionsComponent,
    CustomDialogTitleComponent,
    CustomDatepickerComponent,
    CustomDatepickerInputComponent,
    CustomDatepickerToggleComponent,
  ],
  providers: [
    EndpointListHelper,
    ConfirmationDialogService,
    InternalEventMonitorFactory,
    MetricsRangeSelectorService,
    LongRunningOperationsService,
    SessionService,
    TailwindSortService,
    TailwindSidenavService,
    TailwindPaginatorService,
    TailwindSnackBarService,
    TailwindDialogService,
    TailwindIconRegistry,
    TailwindErrorStateMatcher,
    TailwindDefaultErrorStateMatcher,
    TailwindShowOnDirtyErrorStateMatcher,
    TailwindJsonSchemaFormService
  ]
})
export class SharedModule { }
