import { Component, Input, OnInit } from '@angular/core';

import { ApplicationService } from '../../../../../../features/applications/application.service';
import { getMappedApps } from '../../../../../../features/applications/routes/routes.helper';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-app-route',
  templateUrl: './table-cell-app-route.component.html',
  styleUrls: ['./table-cell-app-route.component.scss']
})
export class TableCellAppRouteComponent<T> extends TableCellCustom<T> { }
