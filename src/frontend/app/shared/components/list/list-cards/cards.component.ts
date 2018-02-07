import { CfAppEventsDataSource } from '../list-types/app-event/cf-app-events-data-source';
import { Component, Input, OnInit, Type, ViewContainerRef, ComponentFactoryResolver, ViewChild } from '@angular/core';
import { IListDataSource } from '../data-sources-controllers/list-data-source-types';


@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent<T> {

  @Input('dataSource') dataSource: IListDataSource<T>;
  @Input('component') component: Type<{}>;
}
