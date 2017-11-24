import { CardEventComponent } from '../shared/components/cards/custom-cards/card-app-event/card-app-event.component';
import {
  CardAppVariableComponent,
} from '../shared/components/cards/custom-cards/card-app-variable/card-app-variable.component';
import { CardAppComponent } from '../shared/components/cards/custom-cards/card-app/card-app.component';
import { TableCellSelectComponent } from '../shared/components/table/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../shared/components/table/table-header-select/table-header-select.component';
import { TableCellEditComponent } from '../shared/components/table/table-cell-edit/table-cell-edit.component';
import {
  TableCellEditVariableComponent,
} from '../shared/components/table/custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import {
  TableCellEventTimestampComponent,
} from '../shared/components/table/custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import {
  TableCellEventTypeComponent,
} from '../shared/components/table/custom-cells/table-cell-event-type/table-cell-event-type.component';
import {
  TableCellEventActionComponent,
} from '../shared/components/table/custom-cells/table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent,
} from '../shared/components/table/custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import { TableCellActionsComponent } from '../shared/components/table/table-cell-actions/table-cell-actions.component';
import {
  TableCellAppNameComponent,
} from '../shared/components/table/custom-cells/table-cell-app-name/table-cell-app-name.component';

export const TableCellEntryPoints = [
  TableCellSelectComponent,
  TableHeaderSelectComponent,
  TableCellEditComponent,
  TableCellEditVariableComponent,
  TableCellEventTimestampComponent,
  TableCellEventTypeComponent,
  TableCellEventActionComponent,
  TableCellEventDetailComponent,
  TableCellActionsComponent,
  TableCellAppNameComponent,
]

export const CardEntryPoints = [
  CardEventComponent,
  CardAppVariableComponent,
  CardAppComponent,
]
