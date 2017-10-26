import { ITableDataSource } from '../../data-sources/table-data-source';
import { Component, ComponentFactoryResolver, Input, OnInit, Type, ViewContainerRef } from '@angular/core';
import { TableColumn } from '../table/table.component';
import { TableCellSelectComponent } from '../table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from '../table-header-select/table-header-select.component';
import { TableCellEditComponent } from '../table-cell-edit/table-cell-edit.component';

export interface ITableCellComponent<T> {
  dataSource: ITableDataSource;
  row: T;
}

@Component({
  selector: 'app-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.scss'],
  entryComponents: [
    TableCellSelectComponent,
    TableHeaderSelectComponent,
    TableCellEditComponent,
  ],
})
export class TableCellComponent<T> implements OnInit {

  @Input('dataSource') dataSource: ITableDataSource;

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
