import { Component, Input, OnDestroy } from '@angular/core';
import { Subscription, Observable } from 'rxjs';

import { objectHelper } from '../../../../../core/helper-classes/object.helpers';
import { pathGet } from '../../../../../core/utils.service';
import { TableCellCustom } from '../../list.types';
import { ICellDefinition } from '../table.types';

@Component({
  selector: 'app-table-cell-default',
  templateUrl: 'app-table-cell-default.component.html',
  styleUrls: ['app-table-cell-default.component.scss']
})
export class TableCellDefaultComponent<T> extends TableCellCustom<T> implements OnDestroy {

  public cellDefinition: ICellDefinition<T>;

  private pRow: T;
  @Input('row')
  get row() { return this.pRow; }
  set row(row: T) {
    this.pRow = row;
    if (row) {
      this.setValue(row, this.schemaKey);
    }
  }

  private pSchemaKey: string;
  @Input('schemaKey')
  get schemaKey() { return this.pSchemaKey; }
  set schemaKey(schemaKey: string) {
    this.pSchemaKey = schemaKey;
    if (this.row) {
      this.setValue(this.row, schemaKey);
    }
  }

  private asyncSub: Subscription;

  public valueContext = { value: null };
  public isLink = false;
  public isExternalLink = false;
  public linkValue: string;
  public linkTarget = '_self';
  public valueGenerator: (row: T, schemaKey?: string) => string | Observable<string>;
  public showShortLink = false;

  public init() {
    this.setValueGenerator();
    this.setValue(this.row);
    this.setSyncLink();
  }

  private setupLinkDeps() {
    if (this.cellDefinition.newTab) {
      this.linkTarget = '_blank';
    }
    this.isExternalLink = this.isLink && this.cellDefinition.externalLink;
    this.showShortLink = this.cellDefinition.showShortLink;
    if (this.showShortLink && !this.isExternalLink) {
      throw Error('Short links must be external links');
    }
  }

  private setSyncLink() {
    if (!this.cellDefinition.getLink) {
      return;
    }
    const linkValue = this.cellDefinition.getLink(this.row);
    if (!linkValue) {
      return;
    }
    this.isLink = true;
    this.linkValue = linkValue;
    this.setupLinkDeps();
  }

  private setupAsyncLink(value) {
    if (!this.cellDefinition.getAsyncLink) {
      return;
    }
    this.isLink = true;
    this.linkValue = this.cellDefinition.getAsyncLink(value);
    this.setupLinkDeps();
  }

  private setupAsync(row) {
    if (this.asyncSub) {
      return;
    }
    const asyncConfig = this.cellDefinition.asyncValue;
    this.asyncSub = row[asyncConfig.pathToObs].subscribe(value => {
      this.valueContext.value = pathGet(asyncConfig.pathToValue, value);
      this.setupAsyncLink(value);
    });
  }

  private setValue(row: T, schemaKey?: string) {
    if (this.cellDefinition && this.cellDefinition.asyncValue) {
      this.setupAsync(row);
    } else if (this.valueGenerator) {
      this.valueContext.value = this.valueGenerator(row, schemaKey);
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

  ngOnDestroy() {
    if (this.asyncSub) {
      this.asyncSub.unsubscribe();
    }
  }

}
