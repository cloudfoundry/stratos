import { animate, style, transition, trigger } from '@angular/animations';
import { CdkRow } from '@angular/cdk/table';
import { ChangeDetectionStrategy, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { RowState } from '../../data-sources-controllers/list-data-source-types';


@Component({
  selector: 'app-table-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
  animations: [
    trigger('listChildAnimation', [
      transition(':enter', [
        style({ opacity: '0', transform: 'translateX(-10px)' }),
        animate('.35s ease', style({ opacity: '1', transform: 'translateX(0)' })),
      ])
    ]),
  ],
})
export class TableRowComponent extends CdkRow implements OnInit {

  @Input('rowState')
  rowState: Observable<RowState>;

  private inErrorState$: Observable<boolean>;
  private errorMessage$: Observable<string>;
  private isBlocked$: Observable<boolean>;

  ngOnInit() {
    if (this.rowState) {
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

}
