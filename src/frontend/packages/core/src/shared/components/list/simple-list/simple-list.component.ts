import { Component, ComponentFactoryResolver, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  StratosCatalogEntity,
} from '../../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { ListComponent } from '../list.component';
import { ListConfig } from '../list.component.types';
import { CatalogEntityDrivenListDataSource } from './entity-catalog-datasource';
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
  public catalogEntity: StratosCatalogEntity;

  @ViewChild(ListHostDirective, { static: true })
  public listHost: ListHostDirective;

  private listConfig: ListConfig<any>;

  public litsComponent: ListComponent<any>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private store: Store<any>,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ListComponent);
    const urlParams = this.route.snapshot.params;
    const endpointGuid = urlParams.endpointId || urlParams.endpointGuid;
    const viewContainerRef = this.listHost.viewContainerRef;
    viewContainerRef.clear();
    const dataSource = new CatalogEntityDrivenListDataSource<any>(
      this.catalogEntity,
      endpointGuid ? { endpointGuid } : {},
      this.store,
    );
    const componentRef = viewContainerRef.createComponent(
      componentFactory,
      null,
      this.makeCustomConfigInjector(dataSource.listConfig)
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
