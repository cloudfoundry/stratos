import { CdkRow } from '@angular/cdk/table';
import { ChangeDetectionStrategy, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { RowState } from '../../data-sources-controllers/list-data-source-types';


@Component({
  selector: 'app-table-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class TableRowComponent extends CdkRow implements OnInit {

  @Input()
  rowState: Observable<RowState>;

  public inErrorState$: Observable<boolean>;
  public inWarningState$: Observable<boolean>;
  public errorMessage$: Observable<string>;
  public isBlocked$: Observable<boolean>;
  public isHighlighted$: Observable<boolean>;
  public isDeleting$: Observable<boolean>;

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
  }

}
