import { APIResource } from '../../../../../store/types/api.types';
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../table/table-cell/table-cell-custom';

@Component({
  selector: 'app-card-app',
  templateUrl: './card-app.component.html',
  styleUrls: ['./card-app.component.scss']
})
export class CardAppComponent extends TableCellCustom<APIResource> { }

