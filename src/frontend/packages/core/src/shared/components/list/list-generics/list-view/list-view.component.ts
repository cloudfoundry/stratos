import { Component, ComponentFactoryResolver, ComponentRef, Injector, Input, OnInit, ViewChild } from '@angular/core';

import { ListComponent } from '../../list.component';
import { IListConfig, ListConfig } from '../../list.component.types';
import { ListHostDirective } from '../helpers/list-host.directive';
import { ListConfigProvider } from '../list-config-provider.types';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss'],
  entryComponents: [
    ListComponent
  ]
})
export class ListViewComponent<T> implements OnInit {

  @Input() config: ListConfigProvider<T>;

  @ViewChild(ListHostDirective, { static: true })
  public listHost: ListHostDirective;

  private componentRef: ComponentRef<ListComponent<unknown>>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) { }

  ngOnInit() {

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ListComponent);

    const viewContainerRef = this.listHost.viewContainerRef;
    this.componentRef = viewContainerRef.createComponent(
      componentFactory,
      null,
      this.makeCustomConfigInjector(this.config.getListConfig())
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
