import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';

import { MultiActionListEntity } from '../../../../../../../store/src/monitors/pagination-monitor';
import { coreEndpointListDetailsComponents } from '../../../../../features/endpoints/endpoint-helpers';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import {
  TableCellEndpointDetailsComponent,
} from '../../list-types/endpoint/table-cell-endpoint-details/table-cell-endpoint-details.component';
import {
  TableCellEndpointNameComponent,
} from '../../list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component';
import {
  TableCellEndpointStatusComponent,
} from '../../list-types/endpoint/table-cell-endpoint-status/table-cell-endpoint-status.component';
import { TableCellCustom } from '../../list.types';
import { TableCellDefaultComponent } from '../app-table-cell-default/app-table-cell-default.component';
import { TableCellActionsComponent } from '../table-cell-actions/table-cell-actions.component';
import { TableCellBooleanIndicatorComponent } from '../table-cell-boolean-indicator/table-cell-boolean-indicator.component';
import { TableCellEditComponent } from '../table-cell-edit/table-cell-edit.component';
import { TableCellExpanderComponent } from '../table-cell-expander/table-cell-expander.component';
import { TableCellFavoriteComponent } from '../table-cell-favorite/table-cell-favorite.component';
import { TableCellIconComponent } from '../table-cell-icon/table-cell-icon.component';
import { TableCellRadioComponent } from '../table-cell-radio/table-cell-radio.component';
import {
  TableCellRequestMonitorIconComponent,
} from '../table-cell-request-monitor-icon/table-cell-request-monitor-icon.component';
import { TableCellSelectComponent } from '../table-cell-select/table-cell-select.component';
import { TableCellSidePanelComponent } from '../table-cell-side-panel/table-cell-side-panel.component';
import { TableHeaderSelectComponent } from '../table-header-select/table-header-select.component';
import { ICellDefinition } from '../table.types';


export const listTableCells: Type<TableCellCustom<any>>[] = [
  TableCellDefaultComponent,
  TableHeaderSelectComponent,
  TableCellSelectComponent,
  TableCellEditComponent,
  TableCellActionsComponent,
  TableCellEndpointStatusComponent,
  TableCellEndpointNameComponent,
  TableCellBooleanIndicatorComponent,
  TableCellRadioComponent,
  TableCellRequestMonitorIconComponent,
  TableCellFavoriteComponent,
  TableCellEndpointDetailsComponent,
  TableCellSidePanelComponent,
  TableCellIconComponent,
  TableCellExpanderComponent,
  ...coreEndpointListDetailsComponents
];

@Component({
  selector: 'app-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  // When we look at modules we should think about swapping this approach (create + insert in code, hard code types here) with
  // NgComponentOutlet (create in html with custom external module factory). Alternatively try marking as entry component where they live?
  entryComponents: [...listTableCells]
})
export class TableCellComponent<T> implements OnInit {
  @ViewChild('target', { read: ViewContainerRef, static: true })
  target: ViewContainerRef;
  private rcRow: T | MultiActionListEntity;

  @Input() dataSource = null as IListDataSource<T>;

  @Input() component: Type<{}>;
  @Input() cellDefinition: ICellDefinition<T>;
  @Input() func: () => string;
  @Input() set row(row: T | MultiActionListEntity) {
    if (this.cellComponent) {
      const { rowValue, entityKey } = this.getRowData(row);
      this.cellComponent.row = rowValue;
      this.cellComponent.entityKey = entityKey;
      if (this.dataSource.getRowState) {
        this.cellComponent.rowState = this.dataSource.getRowState(rowValue, entityKey);
      }
    }
    this.rcRow = row;
  }
  get row() {
    return this.rcRow;
  }

  @Input() config: any;

  private cellComponent: TableCellCustom<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  private getComponent() {
    if (this.cellDefinition) {
      return this.componentFactoryResolver.resolveComponentFactory(
        TableCellDefaultComponent
      );
    } else if (this.component) {
      return this.componentFactoryResolver.resolveComponentFactory(
        this.component
      );
    }
    return null;
  }

  private createComponent() {
    const component = this.getComponent();
    return !!component ? this.target.createComponent(component) : null;
  }

  private getRowData(rowData: T | MultiActionListEntity) {
    const rowValue = MultiActionListEntity.getEntity(rowData);
    const entityKey = MultiActionListEntity.getEntityKey(rowData);
    return {
      rowValue,
      entityKey
    };
  }

  ngOnInit() {
    const component = this.createComponent();
    if (component) {

      // Add to target to ensure ngcontent is correct in new component
      this.cellComponent = component.instance as TableCellCustom<T>;
      const { rowValue, entityKey } = this.getRowData(this.row);
      this.cellComponent.row = rowValue;
      this.cellComponent.entityKey = entityKey;
      this.cellComponent.dataSource = this.dataSource;
      this.cellComponent.config = this.config;
      if (this.dataSource.getRowState) {
        this.cellComponent.rowState = this.dataSource.getRowState(rowValue, entityKey);
      }
      if (this.cellDefinition) {
        const defaultTableCell = this.cellComponent as TableCellDefaultComponent<T>;
        defaultTableCell.cellDefinition = this.cellDefinition;
        defaultTableCell.init();
      }
    }
  }

}
