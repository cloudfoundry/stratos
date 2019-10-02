import { Component, OnInit, Input, ChangeDetectorRef, NgZone, ComponentFactoryResolver, ViewChild, Injector } from '@angular/core';
import { StratosCatalogueEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { ListComponent } from '../list.component';
import { ListConfig, ListViewTypes } from '../list.component.types';
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

  @ViewChild(
    ListHostDirective,
    // TODO: Angular 8
    // { static: true }
  )
  public listHost: ListHostDirective;

  private listConfig: ListConfig<any>;

  public litsComponent: ListComponent<any>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
  ) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ListComponent);

    const viewContainerRef = this.listHost.viewContainerRef;
    viewContainerRef.clear();
    const config = new ListConfig();
    const componentRef = viewContainerRef.createComponent(
      componentFactory,
      null,
      this.makeCustomConfigInjector(config)
    );
    const instance = componentRef.instance as ListComponent<any>;
  }

  ngOnInit() {
  }

  private makeCustomConfigInjector(listConfig: ListConfig<any>) {
    return Injector.create({
      providers: [{ provide: ListConfig, useValue: listConfig }],
      parent: this.injector
    });
  }

}
