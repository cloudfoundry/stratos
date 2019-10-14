import { Component, OnInit, Input, ChangeDetectorRef, NgZone, ComponentFactoryResolver, ViewChild, Injector } from '@angular/core';
import { StratosCatalogueEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { ListComponent } from '../list.component';
import { ListConfig, ListViewTypes } from '../list.component.types';
import { ListHostDirective } from './list-host.directive';
import { CatalogueEntityDrivenListDataSource } from './entity-catalogue-datasource';
import { Store } from '@ngrx/store';

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

  public litsComponent: ListComponent<any>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private store: Store<any>
  ) { }

  ngOnInit() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ListComponent);

    const viewContainerRef = this.listHost.viewContainerRef;
    viewContainerRef.clear();
    const dataSource = new CatalogueEntityDrivenListDataSource<any>(
      this.catalogueEntity,
      {},
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
