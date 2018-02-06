import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VirtualScrollModule } from 'angular2-virtual-scroll';

import { CoreModule } from '../core/core.module';
import {
  ApplicationStateIconComponent,
} from './components/application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from './components/application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from './components/application-state/application-state.component';
import { ApplicationStateService } from './components/application-state/application-state.service';
import { CardStatusComponent } from './components/card-status/card-status.component';
import { CardComponent } from './components/cards/card/card.component';
import { CardsComponent } from './components/cards/cards.component';
import {
  AppEventDetailDialogComponentComponent,
} from './components/cards/custom-cards/card-app-event/app-event-detail-dialog-component/app-event-detail-dialog-component.component';
import { CardAppInstancesComponent } from './components/cards/custom-cards/card-app-instances/card-app-instances.component';
import { CardAppStatusComponent } from './components/cards/custom-cards/card-app-status/card-app-status.component';
import { CardAppUptimeComponent } from './components/cards/custom-cards/card-app-uptime/card-app-uptime.component';
import { CardAppUsageComponent } from './components/cards/custom-cards/card-app-usage/card-app-usage.component';
import { CardAppComponent } from './components/cards/custom-cards/card-app/card-app.component';
import { CfAuthModule } from './components/cf-auth/cf-auth.module';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { ConfirmationDialogService } from './components/confirmation-dialog.service';
import { DetailsCardComponent } from './components/details-card/details-card.component';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { DialogErrorComponent } from './components/dialog-error/dialog-error.component';
import { DisplayValueComponent } from './components/display-value/display-value.component';
import { EditableDisplayValueComponent } from './components/editable-display-value/editable-display-value.component';
import { EndpointsMissingComponent } from './components/endpoints-missing/endpoints-missing.component';
import { FocusDirective } from './components/focus.directive';
import { ListComponent, ListConfig } from './components/list/list.component';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { MetadataItemComponent } from './components/metadata-item/metadata-item.component';
import { NoContentMessageComponent } from './components/no-content-message/no-content-message.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { PageSubheaderComponent } from './components/page-subheader/page-subheader.component';
import { RunningInstancesComponent } from './components/running-instances/running-instances.component';
import { SshViewerComponent } from './components/ssh-viewer/ssh-viewer.component';
import { StatefulIconComponent } from './components/stateful-icon/stateful-icon.component';
import { SteppersModule } from './components/stepper/steppers.module';
import {
  TableCellAppInstancesComponent,
} from './components/table/custom-cells/table-cell-app-instances/table-cell-app-instances.component';
import {
  TableCellAppNameComponent,
} from './components/table/custom-cells/table-cell-app-name/table-cell-app-name.component';
import {
  TableCellAppRouteComponent,
} from './components/table/custom-cells/table-cell-app-route/table-cell-app-route.component';
import {
  TableCellAppStatusComponent,
} from './components/table/custom-cells/table-cell-app-status/table-cell-app-status.component';
import {
  TableCellEditVariableComponent,
} from './components/table/custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import {
  TableCellEndpointStatusComponent,
} from './components/table/custom-cells/table-cell-endpoint-status/table-cell-endpoint-status.component';
import { EventTabActorIconPipe } from './components/table/custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import {
  TableCellEventActionComponent,
} from './components/table/custom-cells/table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent,
} from './components/table/custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import {
  TableCellEventTimestampComponent,
} from './components/table/custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import {
  TableCellEventTypeComponent,
} from './components/table/custom-cells/table-cell-event-type/table-cell-event-type.component';
import { TableCellRadioComponent } from './components/table/custom-cells/table-cell-radio/table-cell-radio.component';
import { TableCellRouteComponent } from './components/table/custom-cells/table-cell-route/table-cell-route.component';
import {
  TableCellTCPRouteComponent,
} from './components/table/custom-cells/table-cell-tcproute/table-cell-tcproute.component';
import { TableCellUsageComponent } from './components/table/custom-cells/table-cell-usage/table-cell-usage.component';
import { TableCellActionsComponent } from './components/table/table-cell-actions/table-cell-actions.component';
import { TableCellEditComponent } from './components/table/table-cell-edit/table-cell-edit.component';
import { TableCellSelectComponent } from './components/table/table-cell-select/table-cell-select.component';
import { TableCellStatusDirective } from './components/table/table-cell-status.directive';
import { TableCellComponent } from './components/table/table-cell/table-cell.component';
import { TableHeaderSelectComponent } from './components/table/table-header-select/table-header-select.component';
import { TableRowComponent } from './components/table/table-row/table-row.component';
import { TableComponent } from './components/table/table.component';
import { TileGridComponent } from './components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from './components/tile/tile-group/tile-group.component';
import { TileComponent } from './components/tile/tile/tile.component';
import { UniqueDirective } from './components/unique.directive';
import { UsageGaugeComponent } from './components/usage-gauge/usage-gauge.component';
import { CfOrgSpaceDataService } from './data-services/cf-org-space-service.service';
import { MbToHumanSizePipe } from './pipes/mb-to-human-size.pipe';
import { PercentagePipe } from './pipes/percentage.pipe';
import { UptimePipe } from './pipes/uptime.pipe';
import { UsageBytesPipe } from './pipes/usage-bytes.pipe';
import { ValuesPipe } from './pipes/values.pipe';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    PageHeaderModule,
    RouterModule,
    SteppersModule,
    VirtualScrollModule,
    CfAuthModule,
    CdkTableModule
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
    TableComponent,
    TableCellComponent,
    TableCellSelectComponent,
    TableCellRadioComponent,
    TableHeaderSelectComponent,
    TableCellEditComponent,
    TableCellEditVariableComponent,
    TableCellEventTimestampComponent,
    TableCellEventTypeComponent,
    TableCellEventActionComponent,
    TableCellEventDetailComponent,
    EventTabActorIconPipe,
    LogViewerComponent,
    ListComponent,
    CardsComponent,
    CardComponent,
    AppEventDetailDialogComponentComponent,
    TableCellActionsComponent,
    CardAppComponent,
    TableCellAppNameComponent,
    NoContentMessageComponent,
    EndpointsMissingComponent,
    TableCellEndpointStatusComponent,
    DialogErrorComponent,
    SshViewerComponent,
    TableCellAppStatusComponent,
    ApplicationStateIconPipe,
    ApplicationStateIconComponent,
    ApplicationStateComponent,
    PageSubheaderComponent,
    TileComponent,
    TileGroupComponent,
    TileGridComponent,
    CardStatusComponent,
    MetadataItemComponent,
    CardAppStatusComponent,
    CardAppInstancesComponent,
    UsageGaugeComponent,
    TableCellUsageComponent,
    TableCellRouteComponent,
    TableCellTCPRouteComponent,
    TableCellAppRouteComponent,
    TableCellStatusDirective,
    CardAppUsageComponent,
    TableRowComponent,
    RunningInstancesComponent,
    DialogConfirmComponent,
    TableCellAppInstancesComponent,
    CardAppUptimeComponent,
    TableCellAppRouteComponent,
    TableCellRadioComponent
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
    TableComponent,
    LogViewerComponent,
    ListComponent,
    CardsComponent,
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
    TableCellUsageComponent,
    TableCellStatusDirective,
    CardAppUsageComponent,
    DialogConfirmComponent,
    CardAppUptimeComponent
  ],
  entryComponents: [
    AppEventDetailDialogComponentComponent,
    DialogConfirmComponent
  ],
  providers: [
    ListConfig,
    ApplicationStateService,
    CfOrgSpaceDataService,
    ConfirmationDialogService
  ]
})
export class SharedModule {}
