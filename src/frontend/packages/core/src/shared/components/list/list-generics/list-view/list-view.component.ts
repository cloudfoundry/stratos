import { Component, ComponentFactoryResolver, ComponentRef, Injector, Input, OnDestroy, Type, ViewChild } from '@angular/core';

import { ListComponent } from '../../list.component';
import { IListConfig, ListConfig } from '../../list.component.types';
import { ListHostDirective } from '../helpers/list-host.directive';
import { ListConfigProvider } from '../list-config-provider.types';

@Component({
    selector: 'app-list-view',
    templateUrl: './list-view.component.html',
    styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent<T> implements OnDestroy {

  @Input() set config(config: ListConfigProvider<T>) {
    if (config) {
      this.create(config);
    }
  }

  @ViewChild(ListHostDirective, { static: true })
  public listHost: ListHostDirective;

  private componentRef: ComponentRef<ListComponent<unknown>>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) { }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  create(listConfig: ListConfigProvider<T>) {
    // Clean up old component
    this.ngOnDestroy();

    // const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ListComponent);
    const viewContainerRef = this.listHost.viewContainerRef;
    this.componentRef = viewContainerRef.createComponent(ListComponent,{
      injector: this.makeCustomConfigInjector(listConfig.getListConfig())
    });
  }

  private makeCustomConfigInjector(listConfig: IListConfig<T>) {
    return Injector.create({
      providers: [{ provide: ListConfig, useValue: listConfig }],
      parent: this.injector
    });
  }
}
