import { Component, Input } from '@angular/core';

import { TableCellCustom } from '../table-cell/table-cell-custom';
import { objectHelper } from './../../../../../core/helper-classes/object.helpers';
import { ICellDefinition } from './../table.types';

@Component({
  moduleId: module.id,
  selector: 'app-table-cell-default',
  templateUrl: 'app-table-cell-default.component.html',
  styleUrls: ['app-table-cell-default.component.scss']
})
export class TableCellDefaultComponent<T> extends TableCellCustom<T> {
  public cellDefinition: ICellDefinition<T>;

  private _row: T;
  @Input('row')
  get row() { return this._row; }
  set row(row: T) {
    this._row = row;
    if (row) {
      this.setValue(row);
    }
  }

  public valueContext = { value: null };
  public isLink = false;
  public isExternalLink = false;
  public linkValue: string;
  public valueGenerator: (row: T) => string;

  public init() {
    this.setValueGenerator();
    this.setValue(this.row);
    this.isLink = !!this.cellDefinition.getLink;
    this.isExternalLink = this.isLink && this.cellDefinition.externalLink;
  }

  private setValue(row: T) {
    if (this.valueGenerator) {
      this.valueContext.value = this.valueGenerator(row);
    }
  }

  private setValueGenerator() {
    this.valueGenerator = this.getValueGenerator(this.cellDefinition);
  }

  private getValueGenerator(cellDefinition: ICellDefinition<T>) {
    return this.getValueGetter(cellDefinition);
  }

  private getValueGetter(cellDefinition: ICellDefinition<T>) {
    if (cellDefinition.getValue) {
      return cellDefinition.getValue;
    } else if (cellDefinition.valuePath) {
      return (row: T) => objectHelper.getPathFromString(row, cellDefinition.valuePath);
    }
    return null;
  }

}
