/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { AppEnvVar } from '../../../../data-sources/cf-app-variables-data-source';
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../table/table-cell/table-cell-custom';

@Component({
  selector: 'app-card-app-variable',
  templateUrl: './card-app-variable.component.html',
  styleUrls: ['./card-app-variable.component.scss']
})
export class CardAppVariableComponent extends TableCellCustom<AppEnvVar> { }
