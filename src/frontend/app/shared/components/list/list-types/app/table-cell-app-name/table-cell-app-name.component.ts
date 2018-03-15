/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { BREADCRUMB_URL_PARAM } from '../../../../page-header/page-header.types';

@Component({
  selector: 'app-table-cell-app-name',
  templateUrl: './table-cell-app-name.component.html',
  styleUrls: ['./table-cell-app-name.component.scss']
})
export class TableCellAppNameComponent<T> extends TableCellCustom<T> {
  public appLinkUrlParam = {
    [BREADCRUMB_URL_PARAM]: 'space'
  };
}
