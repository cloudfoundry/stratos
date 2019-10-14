import { Component, ComponentFactoryResolver, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';

import { StratosCatalogueEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { ListComponent } from '../list.component';
import { ListConfig } from '../list.component.types';
import { CatalogueEntityDrivenListDataSource } from './entity-catalogue-datasource';
import { CatalogueEntityDrivenListConfig } from './entity-catalogue-list-config';
import { ListHostDirective } from './list-host.directive';

@Component({
  selector: 'app-simple-list',
  templateUrl: './simple-list.component.html',
  styleUrls: ['./simple-list.component.scss'],
  entryComponents: [
    ListComponent
  ]
})
export class SimpleListComponent implements OnInit {

  @Input()
  private catalogueEntity: StratosCatalogueEntity;

  @ViewChild(ListHostDirective)
  public listHost: ListHostDirective;

  private listConfig: ListConfig<any>;

  // public litsComponent: ListComponent<any>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private store: Store<any>
  ) { }

  ngOnInit() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ListComponent);

    const viewContainerRef = this.listHost.viewContainerRef;
    viewContainerRef.clear();

    const listConfig = new CatalogueEntityDrivenListConfig<any>(
      this.catalogueEntity
    );

    const dataSource = new CatalogueEntityDrivenListDataSource<any>(
      this.catalogueEntity,
      {},
      this.store,
      listConfig
    );

    listConfig.getDataSource = () => dataSource;

    const componentRef = viewContainerRef.createComponent(
      componentFactory,
      null,
      this.makeCustomConfigInjector(listConfig)
    );
    const instance = componentRef.instance as ListComponent<any>;
  }

  private makeCustomConfigInjector(listConfig: ListConfig<any>) {
    return Injector.create({
      providers: [{ provide: ListConfig, useValue: listConfig }],
      parent: this.injector
    });
  }

}
