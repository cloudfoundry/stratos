import { AppEvent } from '../../../../data-sources/cf-app-events-data-source';
import { Component, OnInit } from '@angular/core';
// import { ICardComponent } from '../../card/card.component';
import { TableCellCustom } from '../../../table/table-cell/table-cell-custom';

@Component({
  selector: 'app-card-event',
  templateUrl: './card-event.component.html',
  styleUrls: ['./card-event.component.scss']
})
export class CardEventComponent extends TableCellCustom<AppEvent> { }
