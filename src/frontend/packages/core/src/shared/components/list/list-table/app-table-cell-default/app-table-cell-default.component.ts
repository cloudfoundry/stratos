import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { objectHelper } from '../../../../../core/helper-classes/object.helpers';
import { pathGet } from '../../../../../core/utils.service';
import { TableCellCustom } from '../../list.types';
import { ICellDefinition } from '../table.types';
import { CustomIconComponent } from '../../../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-table-cell-default',
  templateUrl: 'app-table-cell-default.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent
  ]
})
export class TableCellDefaultComponent<T> extends TableCellCustom<T> implements OnDestroy {
  private cdr = inject(ChangeDetectorRef);


  public cellDefinition!: ICellDefinition<T>;

  @Input('row')
  get row() { return super.row; }
  set row(row: T) {
    super.row = row;
    if (row) {
      this.setValue(row, this.schemaKey);
      this.setSyncLink();
    }
  }

  private pSchemaKey!: string;
  @Input('schemaKey')
  get schemaKey() { return this.pSchemaKey; }
  set schemaKey(schemaKey: string) {
    this.pSchemaKey = schemaKey;
    if (this.row) {
      this.setValue(this.row, schemaKey);
      this.setSyncLink();
    }
  }

  private asyncSub!: Subscription;

  public valueContext: { value: any } = { value: null as any };
  public isLink = false;
  public isExternalLink = false;
  public linkValue!: string;
  public linkTarget = '_self';
  public valueGenerator!: (row: T, schemaKey?: string) => string | Observable<string>;
  public showShortLink = false;

  public init() {
    this.setValueGenerator();
    this.setValue(this.row);
    this.setSyncLink();
    this.cdr.markForCheck();
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
    if (!this.cellDefinition || !this.cellDefinition.getLink) {
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

  private setupAsyncLink(value: any) {
    if (!this.cellDefinition.getAsyncLink) {
      return;
    }
    this.isLink = true;
    this.linkValue = this.cellDefinition.getAsyncLink(value);
    this.setupLinkDeps();
  }

  private setupAsync(row: T) {
    if (this.asyncSub) {
      return;
    }
    const asyncConfig = this.cellDefinition.asyncValue;
    const rowWithObs = row as Record<string, any>;
    this.asyncSub = (rowWithObs[asyncConfig.pathToObs] as Observable<any>).subscribe((value: any) => {
      this.valueContext.value = pathGet(asyncConfig.pathToValue, value as any);
      this.setupAsyncLink(value);
      this.cdr.markForCheck();
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
