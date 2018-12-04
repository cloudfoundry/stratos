import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnChanges,
  OnInit,
  SimpleChange,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';

import { CardCell } from '../../list.types';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent<T> implements OnInit, OnChanges {

  @Input() component: Type<{}>;
  @Input() item: T;
  @Input() dataSource = null as IListDataSource<T>;

  @ViewChild('target', { read: ViewContainerRef }) target;

  cardComponent: CardCell<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    if (!this.component) {
      return;
    }
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);
    // Add to target to ensure ngcontent is correct in new component
    const componentRef = this.target.createComponent(componentFactory);
    this.cardComponent = <CardCell<T>>componentRef.instance;
    this.cardComponent.row = this.item;
    this.cardComponent.dataSource = this.dataSource;
  }

  ngOnChanges(changes: SimpleChanges) {
    const row: SimpleChange = changes.item;
    if (
      row &&
      this.cardComponent &&
      row.previousValue !== row.currentValue
    ) {
      this.cardComponent.row = row.currentValue;
    }
  }

}
