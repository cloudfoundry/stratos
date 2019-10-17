import { Component, ComponentFactoryResolver, ComponentRef, Injector, Input, OnInit, ViewChild } from '@angular/core';

import { ListComponent } from '../list.component';
import { IListConfig, ListConfig } from '../list.component.types';
import { ListHostDirective } from '../simple-list/list-host.directive';

@Component({
  selector: 'app-list-with-config',
  templateUrl: './list-with-config.component.html',
  styleUrls: ['./list-with-config.component.scss'],
  entryComponents: [
    ListComponent
  ]
})
export class ListWithConfigComponent<T> implements OnInit {

  @Input() listConfig: ListConfig<T>;

  @ViewChild(ListHostDirective)
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
      this.makeCustomConfigInjector(this.listConfig)
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
