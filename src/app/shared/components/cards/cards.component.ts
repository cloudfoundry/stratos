import { CfAppEventsDataSource } from '../../data-sources/cf-app-events-data-source';
import { Component, Input, OnInit, Type, ViewContainerRef, ComponentFactoryResolver, ViewChild } from '@angular/core';
import { ITableDataSource } from '../../data-sources/table-data-source';


@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent<T> {

  @Input('dataSource') dataSource = null as ITableDataSource<T>;
  @Input('component') component: Type<{}>;
}
