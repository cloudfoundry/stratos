import { CommonModule, AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  type ComponentRef,
  Input,
  type OnChanges,
  type OnInit,
  type SimpleChanges,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { RowState } from '../../data-sources-controllers/list-data-source-types';
import type { ListExpandedComponentType } from '../../list.component.types';
import type { CardCell } from '../../list.types';
import type { ITableColumn } from '../table.types';
import { TableCellComponent } from '../table-cell/table-cell.component';
import { TableRowExpandedService } from './table-row-expanded-service';
import { CustomIconComponent } from '../../../../../shared/components/custom-material/custom-material.component';
import { AppProgressBarComponent } from '../../../progress-bar/app-progress-bar.component';

@Component({
selector: 'app-table-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    TableCellComponent,
    AppProgressBarComponent
  ]
})
export class TableRowComponent<T = unknown> implements OnInit, OnChanges {

  @ViewChild('expandedComponent', { read: ViewContainerRef, static: true })
  expandedComponent!: ViewContainerRef;

  @Input() columns!: ITableColumn<T>[];
  @Input() dataSource: unknown;
  @Input() rowState!: Observable<RowState>;
  @Input() expandComponent!: ListExpandedComponentType<T>;
  @Input() row!: T;
  @Input() minRowHeight!: string;
  @Input() inExpandedRow!: boolean;
  @Input() rowId!: string;
  @Input() prominentErrorBar!: boolean;
  @Input() togglePosition: 'before' | 'after' = 'before';

  public inErrorState$: Observable<boolean>;
  public inWarningState$: Observable<boolean>;
  public inInfoState$: Observable<boolean>;
  public errorMessage$: Observable<string>;
  public isBlocked$: Observable<boolean>;
  public isHighlighted$: Observable<boolean>;
  public isDeleting$: Observable<boolean>;
  public isWarningIcon$: Observable<boolean>;
  public defaultMinRowHeight = '50px';
  public isExpanded = false;

  private expandedComponentRef: ComponentRef<CardCell<T>>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    public expandedService: TableRowExpandedService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.rowState) {
      this.inErrorState$ = this.rowState.pipe(
        map(state => Boolean(state.error))
      );
      this.inWarningState$ = this.rowState.pipe(
        map(state => Boolean(state.warning))
      );
      this.inInfoState$ = this.rowState.pipe(
        map(state => Boolean(state.info))
      );
      this.errorMessage$ = this.rowState.pipe(
        map(state => state.message || '')
      );
      this.isBlocked$ = this.rowState.pipe(
        map(state => Boolean(state.blocked || state.deleting))
      );
      this.isHighlighted$ = this.rowState.pipe(
        map(state => state.highlighted)
      );
      this.isDeleting$ = this.rowState.pipe(
        map(state => state.deleting)
      );
      this.isWarningIcon$ = this.rowState.pipe(
        map(state => state.error || state.warning)
      );
    }

    // Ensure we 'register' with the expander service. This also helps with page changes
    this.expandedService.collapse(this.rowId);
  }

  ngOnChanges(changes: SimpleChanges) {
    // When row, columns, or other relevant inputs change, mark for check
    // This is necessary in zoneless mode with OnPush change detection
    if (changes.row || changes.columns || changes.dataSource) {
      // Update expanded component if it exists with new row data
      if (this.expandedComponentRef && changes.row) {
        const instance: CardCell<T> = this.expandedComponentRef.instance;
        instance.row = this.row;
      }
      // Mark for check to ensure template expressions re-evaluate in zoneless mode
      this.cdr.markForCheck();
    }
  }

  private getComponent() {
    if (!this.expandComponent) {
      return;
    }
    return this.componentFactoryResolver.resolveComponentFactory(
      this.expandComponent
    );
  }

  private createComponent() {
    const component = this.getComponent();
    return component ? this.expandedComponent.createComponent(component) : null;
  }

  public panelOpened() {
    this.createExpandedComponent();
    this.expandedService.expand(this.rowId);
  }

  public createExpandedComponent() {
    if (this.expandedComponentRef) {
      return;
    }
    this.expandedComponentRef = this.createComponent();
    if (!this.expandedComponentRef) {
      return;
    }
    const instance: CardCell<T> = this.expandedComponentRef.instance;
    instance.row = this.row; // This could be set again when `row` changes above
  }

  public toggleExpand() {
    if (!this.expandComponent) {
      return;
    }
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.panelOpened();
    } else {
      this.expandedService.collapse(this.rowId);
    }
  }

}
