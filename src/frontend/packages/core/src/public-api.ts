/*
 * Public API Surface of core
 */

// export * from './app.module';

// Extensions
export * from './core/extension/extension-service';

// Customization
export * from './core/customizations.types';

// Modules
export * from './core/core.module';
export * from './core/md.module';
export * from './shared/shared.module';

// LoginPageComponent
export { LoginPageComponent } from './features/login/login-page/login-page.component';

export { ProfileSettingsTypes } from './shared/components/profile-settings/profile-settings.component';

// Tailwind Material Replacements
export * from './shared/services/tailwind-material-replacements';
export * from './shared/services/tailwind-snackbar.service';
export * from './shared/services/tailwind-dialog.service';
export * from './shared/services/tailwind-sidenav.service';
export * from './shared/services/tailwind-sort.service';
export * from './shared/services/tailwind-paginator.service';
export * from './shared/services/tailwind-json-schema-form.service';
export * from './shared/services/tailwind-icon-registry.service';

// Tailwind Progress Components
export { ProgressSpinnerComponent, MatSpinnerComponent } from './shared/components/progress-spinner/progress-spinner.component';
export { AppSpinnerComponent } from './shared/components/progress-spinner/app-spinner.component';
export { ProgressBarComponent } from './shared/components/progress-bar/progress-bar.component';
export { AppProgressBarComponent } from './shared/components/progress-bar/app-progress-bar.component';

// Shared Components
export { PageHeaderComponent } from './shared/components/page-header/page-header.component';
export { SteppersComponent } from './shared/components/stepper/steppers/steppers.component';
export { StepComponent } from './shared/components/stepper/step/step.component';
export { PageSubNavComponent } from './shared/components/page-sub-nav/page-sub-nav.component';
export { PageSubNavSectionComponent } from './shared/components/page-sub-nav-section/page-sub-nav-section.component';

// Custom Material Replacement Components
export { CustomIconComponent } from './shared/components/custom-material/custom-material.component';
export { CustomSpinnerComponent } from './shared/components/custom-material/custom-material.component';
// AppCustomSpinnerComponent removed - use AppSpinnerComponent from progress-spinner instead
export { CustomProgressBarComponent } from './shared/components/custom-material/custom-material.component';
export { CustomProgressBarSelectorComponent } from './shared/components/custom-material/custom-material.component';
export { CustomDialogContentComponent } from './shared/components/custom-material/custom-material.component';
export { CustomDialogActionsComponent } from './shared/components/custom-material/custom-material.component';
export { CustomDialogTitleComponent } from './shared/components/custom-material/custom-material.component';
export { CustomDatepickerComponent } from './shared/components/custom-material/custom-material.component';
export { CustomDatepickerInputComponent } from './shared/components/custom-material/custom-material.component';
export { CustomDatepickerToggleComponent } from './shared/components/custom-material/custom-material.component';
export { MatDatepickerDirective } from './shared/components/custom-material/custom-material.component';
export { CustomTabGroupComponent, CustomTabComponent, MatTabChangeEvent } from './shared/components/custom-tabs/custom-tabs.component';

// Custom Expansion Panel Components
export { CustomExpansionPanelComponent, CustomExpansionPanelHeaderComponent } from './shared/components/custom-expansion-panel/custom-expansion-panel.component';

// Custom Form Field Components
export {
  CustomFormFieldComponent,
  CustomFormFieldIconComponent,
  CustomIconButtonDirective,
  CustomButtonDirective,
  MatInputDirective,
  AppInputDirective,
  MatSuffixDirective,
  MatLabelComponent
} from './shared/components/custom-form-field/custom-form-field.component';

// Custom Select Components
export { CustomSelectComponent, CustomOptionComponent } from './shared/components/custom-select/custom-select.component';

// Custom Checkbox Component
export { CustomCheckboxComponent } from './shared/components/custom-checkbox/custom-checkbox.component';

// Custom Slide Toggle Component
export { CustomSlideToggleComponent } from './shared/components/custom-slide-toggle/custom-slide-toggle.component';

// Monaco Editor Component
export { MonacoEditorComponent, MonacoEditorModel, MonacoEditorOptions } from './shared/components/monaco-editor/monaco-editor.component';

// Tile Components
export { TileGridComponent } from './shared/components/tile/tile-grid/tile-grid.component';
export { TileGroupComponent } from './shared/components/tile/tile-group/tile-group.component';
export { TileComponent } from './shared/components/tile/tile/tile.component';

// UI Components
export { LoadingPageComponent } from './shared/components/loading-page/loading-page.component';
export { StatefulIconComponent } from './core/stateful-icon/stateful-icon.component';
export { AppChipsComponent, AppChip, IAppChip } from './shared/components/chips/chips.component';
export { BooleanIndicatorComponent } from './shared/components/boolean-indicator/boolean-indicator.component';
export { NoContentMessageComponent } from './shared/components/no-content-message/no-content-message.component';
export { UploadProgressIndicatorComponent } from './shared/components/upload-progress-indicator/upload-progress-indicator.component';
export { EntitySummaryTitleComponent } from './shared/components/entity-summary-title/entity-summary-title.component';
export { RingChartComponent } from './shared/components/ring-chart/ring-chart.component';
export { CardProgressOverlayComponent } from './shared/components/card-progress-overlay/card-progress-overlay.component';

// List Components
export { ListComponent } from './shared/components/list/list.component';
export { ListViewComponent } from './shared/components/list/list-generics/list-view/list-view.component';
export * from './shared/components/list/list.component.types';
export * from './shared/components/list/data-sources-controllers/list-data-source-types';
export * from './shared/components/list/data-sources-controllers/list-data-source';
export * from './shared/components/list/data-sources-controllers/list-pagination-controller';
export { ActionListConfigProvider } from './shared/components/list/list-generics/list-providers/action-list-config-provider';

// Utility Components
export { MultilineTitleComponent } from './shared/components/multiline-title/multiline-title.component';
export { MetadataItemComponent } from './shared/components/metadata-item/metadata-item.component';
export { DialogErrorComponent } from './shared/components/dialog-error/dialog-error.component';
export { CodeBlockComponent } from './shared/components/code-block/code-block.component';
export { CardNumberMetricComponent } from './shared/components/cards/card-number-metric/card-number-metric.component';

// Card Components
export { CardWrapperComponent } from './shared/components/cards/card/card.component';
export { CardHeaderComponent } from './shared/components/cards/card-header/card-header.component';
export { CardTitleComponent } from './shared/components/cards/card-title/card-title.component';
export { CardContentComponent } from './shared/components/cards/card-content/card-content.component';
export { CardStatusComponent } from './shared/components/cards/card-status/card-status.component';

// Custom Card Components (mat-card replacements)
export {
  CustomCardComponent,
  CustomCardHeaderComponent,
  CustomCardTitleComponent,
  CustomCardSubtitleComponent,
  CustomCardContentComponent,
  CustomCardActionsComponent,
  CustomCardFooterComponent
} from './shared/components/custom-card/custom-card.component';

// Stepper Types
export * from './shared/components/stepper/step/step.component';
export * from './shared/components/stepper/stepper.types';
export * from './shared/components/page-header/page-header.types';

// Pipes
export { BytesToHumanSize } from './core/byte-formatters.pipe';
export { MegaBytesToHumanSize } from './core/byte-formatters.pipe';
export { CapitalizeFirstPipe } from './shared/pipes/capitalizeFirstLetter.pipe';

// Directives
export { BlurDirective } from './shared/components/blur.directive';
export { ClickStopPropagationDirective } from './core/click-stop-propagation.directive';
export { CustomTooltipDirective } from './shared/components/custom-tooltip/custom-tooltip.directive';

// Dialog Services and Config
export { ConfirmationDialogService } from './shared/components/confirmation-dialog.service';
export { ConfirmationDialogConfig, TypeToConfirm } from './shared/components/confirmation-dialog.config';
export { SidePanelService } from './shared/services/side-panel.service';
export { SnackBarService } from './shared/services/snackbar.service';
