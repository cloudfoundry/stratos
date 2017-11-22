import { EventTabActorIconPipe } from './components/table/custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { VirtualScrollModule } from 'angular2-virtual-scroll';
import { CoreModule } from '../core/core.module';
import { DisplayValueComponent } from './components/display-value/display-value.component';
import { EditableDisplayValueComponent } from './components/editable-display-value/editable-display-value.component';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { StatefulIconComponent } from './components/stateful-icon/stateful-icon.component';
import { SteppersModule } from './components/stepper/steppers.module';
import { MbToHumanSizePipe } from './pipes/mb-to-human-size.pipe';
import { DetailsCardComponent } from './components/details-card/details-card.component';
import { FocusDirective } from './components/focus.directive';
import { UniqueDirective } from './components/unique.directive';
import { ValuesPipe } from './pipes/values.pipe';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { TableComponent } from './components/table/table.component';
import { TableCellComponent } from './components/table/table-cell/table-cell.component';
import { TableCellSelectComponent } from './components/table/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from './components/table/table-header-select/table-header-select.component';
import { TableCellEditComponent } from './components/table/table-cell-edit/table-cell-edit.component';
import {
  TableCellEditVariableComponent
} from './components/table/custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import {
  TableCellEventTimestampComponent
} from './components/table/custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import { TableCellEventTypeComponent } from './components/table/custom-cells/table-cell-event-type/table-cell-event-type.component';
import { TableCellEventActionComponent } from './components/table/custom-cells/table-cell-event-action/table-cell-event-action.component';
import { TableCellEventDetailComponent } from './components/table/custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import { LogViewerComponent } from './components/log-viewer/log-viewer.component';
import { CardsComponent } from './components/cards/cards.component';
import { CardComponent } from './components/cards/card/card.component';
import { CardAppVariableComponent } from './components/cards/custom-cards/card-app-variable/card-app-variable.component';
import { CardEventComponent } from './components/cards/custom-cards/card-app-event/card-app-event.component';
import {
  AppEventDetailDialogComponentComponent
} from './components/cards/custom-cards/card-app-event/app-event-detail-dialog-component/app-event-detail-dialog-component.component';
import { ListComponent } from './components/list/list.component';
import { TableCellActionsComponent } from './components/table/table-cell-actions/table-cell-actions.component';


@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    PageHeaderModule,
    RouterModule,
    SteppersModule,
    VirtualScrollModule
  ],
  declarations: [
    LoadingPageComponent,
    DisplayValueComponent,
    StatefulIconComponent,
    EditableDisplayValueComponent,
    MbToHumanSizePipe,
    ValuesPipe,
    LoadingPageComponent,
    DetailsCardComponent,
    FocusDirective,
    UniqueDirective,
    CodeBlockComponent,
    TableComponent,
    TableCellComponent,
    TableCellSelectComponent,
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
    CardEventComponent,
    CardAppVariableComponent,
    AppEventDetailDialogComponentComponent,
    TableCellActionsComponent,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    LoadingPageComponent,
    PageHeaderModule,
    DisplayValueComponent,
    EditableDisplayValueComponent,
    DetailsCardComponent,
    SteppersModule,
    StatefulIconComponent,
    MbToHumanSizePipe,
    ValuesPipe,
    SteppersModule,
    FocusDirective,
    UniqueDirective,
    CodeBlockComponent,
    TableComponent,
    LogViewerComponent,
    ListComponent,
    CardsComponent,
  ],
  entryComponents: [AppEventDetailDialogComponentComponent]
})
export class SharedModule { }
