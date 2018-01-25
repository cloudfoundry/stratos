import { Component, OnInit, Type, Input, ViewChild, ViewContainerRef, ComponentFactoryResolver, OnChanges, SimpleChanges, SimpleChange } from '@angular/core';
import { TableCellCustom } from '../../table/table-cell/table-cell-custom';
import { CardAppVariableComponent } from '../custom-cards/card-app-variable/card-app-variable.component';
import { CardEventComponent } from '../custom-cards/card-app-event/card-app-event.component';
import { CardAppComponent } from '../custom-cards/card-app/card-app.component';
import { IListDataSource } from '../../../data-sources/list-data-source-types';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  entryComponents: [
    CardEventComponent,
    CardAppVariableComponent,
    CardAppComponent,
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
