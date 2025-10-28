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

// Shared Components
export { PageHeaderComponent } from './shared/components/page-header/page-header.component';
export { SteppersComponent } from './shared/components/stepper/steppers/steppers.component';
export { StepComponent } from './shared/components/stepper/step/step.component';
export { PageSubNavComponent } from './shared/components/page-sub-nav/page-sub-nav.component';
export { PageSubNavSectionComponent } from './shared/components/page-sub-nav-section/page-sub-nav-section.component';

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

// Dialog Services and Config
export { ConfirmationDialogService } from './shared/components/confirmation-dialog.service';
export { ConfirmationDialogConfig, TypeToConfirm } from './shared/components/confirmation-dialog.config';
export { SidePanelService } from './shared/services/side-panel.service';
export { SnackBarService } from './shared/services/snackbar.service';
