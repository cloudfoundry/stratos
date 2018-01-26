import { CdkRow } from '@angular/cdk/table';
import { ChangeDetectionStrategy, Component, HostBinding, OnInit, ViewEncapsulation } from '@angular/core';


@Component({
  selector: 'app-table-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
})
export class TableRowComponent extends CdkRow implements OnInit {
  @HostBinding('class')
  class = 'mat-row';

  // @HostBinding('role')
  // row = 'row';

  constructor() {
    super();
  }

  ngOnInit() {
  }

}
