import { CfAppEventsDataSource } from '../../data-sources/cf-app-events-data-source';
import { Component, Input, OnInit, Type, ViewContainerRef, ComponentFactoryResolver, ViewChild } from '@angular/core';
import { ITableDataSource } from '../../data-sources/table-data-source';


@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent<T> implements OnInit {

  @Input('dataSource') dataSource = null as ITableDataSource<T>;
  @Input('component') component: Type<{}>;
  // @ViewChild('target', { read: ViewContainerRef }) target;


  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    // this.dataSource.connect().subscribe((items: T[]) => {

    // })
    // if (this.dataSource) {
    //   const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);
    //   // Add to target to ensure ngcontent is correct in new component
    //   const componentRef = this.target.createComponent(
    //     componentFactory,
    //     0,
    //     undefined, );
    //   const cellComponent = <ICardComponent<T>>componentRef.instance;
    //   cellComponent.row = this.row;
    //   cellComponent.dataSource = this.dataSource;
    // }
  }

}
