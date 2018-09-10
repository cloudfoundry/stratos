import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../../../../src/frontend/app/shared/components/list/list.types';

@Component({
  selector: 'app-app-link',
  templateUrl: './app-link.component.html',
  styleUrls: ['./app-link.component.scss']
})
export class AppLinkComponent<T> extends TableCellCustom<T> {

  constructor() {
    super();
  }

}
