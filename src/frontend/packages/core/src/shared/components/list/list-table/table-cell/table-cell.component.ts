import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  Input,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  inject, ChangeDetectionStrategy } from '@angular/core';
import { MultiActionListEntity } from '@stratosui/store';

import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { TableCellCustom } from '../../list.types';
import { TableCellDefaultComponent } from '../app-table-cell-default/app-table-cell-default.component';
import { ICellDefinition } from '../table.types';

@Component({
  selector: 'app-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class TableCellComponent<T> implements OnInit {
  @ViewChild('target', { read: ViewContainerRef, static: true })
  target!: ViewContainerRef;
  private rcRow!: T | MultiActionListEntity;

  @Input() dataSource = null as IListDataSource<T>;

  @Input() component!: Type<{}>;
  @Input() cellDefinition!: ICellDefinition<T>;
  @Input() func!: () => string;
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

  @Input() config: object | undefined;

  private cellComponent!: TableCellCustom<T>;
  private componentFactoryResolver = inject(ComponentFactoryResolver);
  private cdr = inject(ChangeDetectorRef);

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
      // Zoneless + OnPush: force CD on dynamically created component
      component.changeDetectorRef.detectChanges();
    }
  }

}
