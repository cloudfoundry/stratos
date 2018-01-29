import { CdkRow } from '@angular/cdk/table';
import { ChangeDetectionStrategy, Component, HostBinding, OnInit, ViewEncapsulation, ViewContainerRef, Directive } from '@angular/core';
import { CdkCellDef } from '@angular/cdk/table';
import { CdkCellOutlet } from '@angular/cdk/table';
import { Input } from '@angular/core';
import { ListDataSource } from '../../../data-sources/list-data-source';
import { RowState } from '../../../data-sources/list-data-source-types';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';


@Component({
  selector: 'app-table-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss'],
  // tslint:disable-next-line:use-host-property-decorator
  host: {
    'role': 'row',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
})
export class TableRowComponent extends CdkRow implements OnInit {

  @Input('rowState')
  rowState: Observable<RowState>;

  private inErrorState$: Observable<boolean>;
  private errorMessage$: Observable<string>;
  private isBlocked$: Observable<boolean>;

  ngOnInit() {
    this.inErrorState$ = this.rowState.pipe(
      map(state => state.error)
    );
    this.errorMessage$ = this.rowState.pipe(
      map(state => state.message)
    );
    this.isBlocked$ = this.rowState.pipe(
      map(state => state.blocked)
    );
  }

}
