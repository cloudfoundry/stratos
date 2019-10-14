import { Component, ComponentFactoryResolver, ComponentRef, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';

import { IListDataSourceConfig } from '../data-sources-controllers/list-data-source-config';
import { ListComponent } from '../list.component';
import { IListConfig, ListConfig } from '../list.component.types';
import { ListHostDirective } from '../simple-list/list-host.directive';
import { ListDefaultsActionOrConfig } from './defaults-datasource';
import { createListDefaultConfig } from './defaults-list-config';

@Component({
  selector: 'app-defaults-list',
  templateUrl: './defaults-list.component.html',
  styleUrls: ['./defaults-list.component.scss'],
  entryComponents: [
    ListComponent
  ]
})
export class DefaultsListComponent<A, T> implements OnInit {

  @Input() actionOrConfig: ListDefaultsActionOrConfig;
  @Input() listConfig: Partial<IListConfig<T>>;
  @Input() dataSourceConfig: Partial<IListDataSourceConfig<A, T>>;

  @ViewChild(ListHostDirective)
  public listHost: ListHostDirective;

  private componentRef: ComponentRef<ListComponent<unknown>>;

  constructor(
    private store: Store<any>,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) { }

  ngOnInit() {
    const listConfig = createListDefaultConfig(
      this.store,
      this.actionOrConfig,
      this.listConfig,
      this.dataSourceConfig
    );

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ListComponent);

    const viewContainerRef = this.listHost.viewContainerRef;
    this.componentRef = viewContainerRef.createComponent(
      componentFactory,
      null,
      this.makeCustomConfigInjector(listConfig)
    );
  }

  private makeCustomConfigInjector(listConfig: IListConfig<T>) {
    return Injector.create({
      providers: [{ provide: ListConfig, useValue: listConfig }],
      parent: this.injector
    });
  }

  ngDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

}
