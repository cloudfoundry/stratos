import { CardAppComponent } from '../shared/components/cards/custom-cards/card-app/card-app.component';
import {
  TableCellAppInstancesComponent,
} from '../shared/components/table/custom-cells/table-cell-app-instances/table-cell-app-instances.component';
import {
  TableCellAppNameComponent,
} from '../shared/components/table/custom-cells/table-cell-app-name/table-cell-app-name.component';
import {
  TableCellAppRouteComponent,
} from '../shared/components/table/custom-cells/table-cell-app-route/table-cell-app-route.component';
import {
  TableCellAppStatusComponent,
} from '../shared/components/table/custom-cells/table-cell-app-status/table-cell-app-status.component';
import {
  TableCellEditVariableComponent,
} from '../shared/components/table/custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';
import {
  TableCellEndpointStatusComponent,
} from '../shared/components/table/custom-cells/table-cell-endpoint-status/table-cell-endpoint-status.component';
import {
  TableCellEventActionComponent,
} from '../shared/components/table/custom-cells/table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent,
} from '../shared/components/table/custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import {
  TableCellEventTimestampComponent,
} from '../shared/components/table/custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import {
  TableCellEventTypeComponent,
} from '../shared/components/table/custom-cells/table-cell-event-type/table-cell-event-type.component';
import {
  TableCellRouteComponent,
} from '../shared/components/table/custom-cells/table-cell-route/table-cell-route.component';
import {
  TableCellTCPRouteComponent,
} from '../shared/components/table/custom-cells/table-cell-tcproute/table-cell-tcproute.component';
import {
  TableCellUsageComponent,
} from '../shared/components/table/custom-cells/table-cell-usage/table-cell-usage.component';
import { TableCellActionsComponent } from '../shared/components/table/table-cell-actions/table-cell-actions.component';
import { TableCellEditComponent } from '../shared/components/table/table-cell-edit/table-cell-edit.component';
import { TableCellSelectComponent } from '../shared/components/table/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../shared/components/table/table-header-select/table-header-select.component';

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
  TableCellAppInstancesComponent,
  TableCellEndpointStatusComponent,
  TableCellAppStatusComponent,
  TableCellUsageComponent,
  TableCellRouteComponent,
  TableCellTCPRouteComponent,
  TableCellAppRouteComponent
];

export const CardEntryPoints = [CardAppComponent];
