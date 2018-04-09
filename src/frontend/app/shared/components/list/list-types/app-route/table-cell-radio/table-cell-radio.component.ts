import { Component, Input, OnInit } from '@angular/core';

import { ApplicationService } from '../../../../../../features/applications/application.service';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-radio',
  templateUrl: './table-cell-radio.component.html',
  styleUrls: ['./table-cell-radio.component.scss']
})
export class TableCellRadioComponent<T> extends TableCellCustom<T>
  implements OnInit {
  @Input('row') row;
  disable: boolean;
  constructor(private appService: ApplicationService) {
    super();
  }

  ngOnInit() {
    const foundApp =
      this.row.entity &&
      this.row.entity.apps &&
      this.row.entity.apps.find(
        a => a.metadata.guid === this.appService.appGuid
      );
    this.disable = foundApp && foundApp.length !== 0;
  }
}
