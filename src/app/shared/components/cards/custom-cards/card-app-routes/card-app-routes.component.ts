import { EntityInfo } from '../../../../../store/types/api.types';
import { TableCellCustom } from '../../../table/table-cell/table-cell-custom';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-app-routes',
  templateUrl: './card-app-routes.component.html',
  styleUrls: ['./card-app-routes.component.scss']
})
export class CardAppRoutesComponent extends TableCellCustom<EntityInfo> implements OnInit {

  constructor() {
    super();
  }

  ngOnInit() {
  }

}
