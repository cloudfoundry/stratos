import { ITableDataSource } from '../../../data-sources/table-data-source';
import { Component, ComponentFactoryResolver, Input, OnInit, Type, ViewContainerRef } from '@angular/core';
import { TableColumn } from '../table.component';
import { TableCellSelectComponent } from '../table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../table-header-select/table-header-select.component';
import { TableCellEditComponent } from '../table-cell-edit/table-cell-edit.component';
import { TableCellEditVariableComponent } from '../custom-cells/table-cell-edit-variable/table-cell-edit-variable.component';

export interface ITableCellComponent<T> {
  dataSource: ITableDataSource;
  row: T;
}

@Component({
  selector: 'app-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.scss'],
  // When we look at modules we should think about swapping this approach (create + insert in code, hard code types here) with
  // NgComponentOutlet (create in html with custom external module factory)
  entryComponents: [
    TableCellSelectComponent,
    TableHeaderSelectComponent,
    TableCellEditComponent,
    TableCellEditVariableComponent,
  ],
})
export class TableCellComponent<T> implements OnInit {

  @Input('dataSource') dataSource = null as ITableDataSource;

  @Input('component') component: Type<{}>;
  @Input('func') func: () => string;
  @Input('row') row: T;

  constructor(private viewContainerRef: ViewContainerRef, private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    if (this.component) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);
      const componentRef = this.viewContainerRef.createComponent(componentFactory);
      const cellComponent = <ITableCellComponent<T>>componentRef.instance;
      cellComponent.row = this.row;
      cellComponent.dataSource = this.dataSource;
    }
  }

}
