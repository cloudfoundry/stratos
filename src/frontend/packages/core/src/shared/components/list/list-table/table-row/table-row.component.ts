import { CdkRow } from '@angular/cdk/table';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Input,
  OnInit,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RowState } from '../../data-sources-controllers/list-data-source-types';
import { ListExpandedComponentType } from '../../list.component.types';
import { CardCell } from '../../list.types';


@Component({
  selector: 'app-table-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class TableRowComponent<T = any> extends CdkRow implements OnInit {

  @ViewChild('expandedComponent', { read: ViewContainerRef, static: true })
  expandedComponent: ViewContainerRef;

  @Input() rowState: Observable<RowState>;
  @Input() expandComponent: ListExpandedComponentType<T>;
  @Input() row: T;
  @Input() minRowHeight: string;
  @Input() inExpandedRow: boolean;

  public inErrorState$: Observable<boolean>;
  public inWarningState$: Observable<boolean>;
  public errorMessage$: Observable<string>;
  public isBlocked$: Observable<boolean>;
  public isHighlighted$: Observable<boolean>;
  public isDeleting$: Observable<boolean>;
  public defaultMinRowHeight = '50px';

  private expandedComponentRef: ComponentRef<any>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {
    super();
  }

  ngOnInit() {
    if (this.rowState) {
      this.inErrorState$ = this.rowState.pipe(
        map(state => state.error)
      );
      this.inWarningState$ = this.rowState.pipe(
        map(state => state.warning)
      );
      this.errorMessage$ = this.rowState.pipe(
        map(state => state.message)
      );
      this.isBlocked$ = this.rowState.pipe(
        map(state => state.blocked || state.deleting)
      );
      this.isHighlighted$ = this.rowState.pipe(
        map(state => state.highlighted)
      );
      this.isDeleting$ = this.rowState.pipe(
        map(state => state.deleting)
      );
    }
    if (this.expandComponent) {
      this.defaultMinRowHeight = '64px';
    }
  }

  private getComponent() {
    return this.componentFactoryResolver.resolveComponentFactory(
      this.expandComponent
    );
  }

  private createComponent() {
    const component = this.getComponent();
    return !!component ? this.expandedComponent.createComponent(component) : null;
  }

  public createExpandedComponent() {
    if (this.expandedComponentRef) {
      return;
    }
    this.expandedComponentRef = this.createComponent();
    const instance: CardCell<any> = this.expandedComponentRef.instance;
    instance.row = this.row; // This could be set again when `row` changes above
  }

}
