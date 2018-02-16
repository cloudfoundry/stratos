import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnChanges,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
  SimpleChanges,
  SimpleChange,
} from '@angular/core';

import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { TableCellCustom } from '../../list-table/table-cell/table-cell-custom';
import { CardAppComponent } from '../../list-types/app/card/card-app.component';
import { EndpointCardComponent } from '../custom-cards/endpoint-card/endpoint-card.component';

export const listCards = [
  CardAppComponent,
  EndpointCardComponent
];

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  entryComponents: [
    ...listCards,
  ]
})
export class CardComponent<T> implements OnInit, OnChanges {

  @Input('component') component: Type<{}>;
  @Input('item') item: T;
  @Input('dataSource') dataSource = null as IListDataSource<T>;

  @ViewChild('target', { read: ViewContainerRef }) target;

  cardComponent: TableCellCustom<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    if (!this.component) {
      return;
    }
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);
    // Add to target to ensure ngcontent is correct in new component
    const componentRef = this.target.createComponent(componentFactory);
    this.cardComponent = <TableCellCustom<T>>componentRef.instance;
    this.cardComponent.row = this.item;
    this.cardComponent.dataSource = this.dataSource;
  }

  ngOnChanges(changes: SimpleChanges) {
    const row: SimpleChange = changes.row;
    if (
      row &&
      this.cardComponent &&
      row.previousValue !== row.currentValue
    ) {
      this.cardComponent.row = row.currentValue;
    }
  }

}
