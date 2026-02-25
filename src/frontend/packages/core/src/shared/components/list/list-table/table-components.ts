/**
 * Component registry for table components.
 *
 * This file exists to break circular dependencies between table.types.ts and table-cell.component.ts.
 * By separating the component array from type definitions, we follow Angular 20 best practices:
 * - Types remain pure and lightweight
 * - Component registration has clear dependency direction
 * - Better tree-shaking and build performance
 */

import { Type } from '@angular/core';
import { coreEndpointListDetailsComponents } from '../../../../features/endpoints/endpoint-helpers';
import { TableCellCustom } from '../list.types';
import {
  TableCellEndpointAddressComponent,
} from '../list-types/endpoint/table-cell-endpoint-address/table-cell-endpoint-address.component';
import {
  TableCellEndpointDetailsComponent,
} from '../list-types/endpoint/table-cell-endpoint-details/table-cell-endpoint-details.component';
import {
  TableCellEndpointNameComponent,
} from '../list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component';
import { TableCellDefaultComponent } from './app-table-cell-default/app-table-cell-default.component';
import { TableCellActionsComponent } from './table-cell-actions/table-cell-actions.component';
import { TableCellBooleanIndicatorComponent } from './table-cell-boolean-indicator/table-cell-boolean-indicator.component';
import { TableCellEditComponent } from './table-cell-edit/table-cell-edit.component';
import { TableCellExpanderComponent } from './table-cell-expander/table-cell-expander.component';
import { TableCellFavoriteComponent } from './table-cell-favorite/table-cell-favorite.component';
import { TableCellIconComponent } from './table-cell-icon/table-cell-icon.component';
import { TableCellRadioComponent } from './table-cell-radio/table-cell-radio.component';
import {
  TableCellRequestMonitorIconComponent,
} from './table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';
import { TableCellSelectComponent } from './table-cell-select/table-cell-select.component';
import { TableCellSidePanelComponent } from './table-cell-side-panel/table-cell-side-panel.component';
import { TableCellStatusDirective } from './table-cell-status.directive';
import { TableCellComponent } from './table-cell/table-cell.component';
import { TableHeaderSelectComponent } from './table-header-select/table-header-select.component';
import { TableRowComponent } from './table-row/table-row.component';

// Define listTableCells here to avoid circular dependencies
const listTableCells: Type<TableCellCustom<any>>[] = [
  TableCellDefaultComponent,
  TableHeaderSelectComponent,
  TableCellSelectComponent,
  TableCellEditComponent,
  TableCellActionsComponent,
  // TableCellEndpointStatusComponent is now standalone - not included in declarations array
  TableCellEndpointNameComponent,
  TableCellBooleanIndicatorComponent,
  TableCellRadioComponent,
  TableCellRequestMonitorIconComponent,
  TableCellFavoriteComponent,
  TableCellEndpointDetailsComponent,
  TableCellSidePanelComponent,
  TableCellIconComponent,
  TableCellExpanderComponent,
  TableCellEndpointAddressComponent,
  ...coreEndpointListDetailsComponents
];

export const listTableComponents = [
  // TableComponent is now standalone - should not be in declarations array
  TableCellComponent,
  TableRowComponent,
  ...listTableCells,
  TableCellStatusDirective,
];

// Export listTableCells for use in component tests
export { listTableCells };
