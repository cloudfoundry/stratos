import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentFactoryResolver, type ComponentRef, Injector, Input, type OnDestroy, ViewChild } from '@angular/core';

import { ListComponent } from '../../list.component';
import { type IListConfig, ListConfig } from '../../list.component.types';
import { ListHostDirective } from '../helpers/list-host.directive';
import type { ListConfigProvider } from '../list-config-provider.types';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ListHostDirective
  ]
})
export class ListViewComponent<T> implements OnDestroy {

  @Input() set config(config: ListConfigProvider<T>) {
    if (config) {
      this.create(config);
    }
  }

  @ViewChild(ListHostDirective, { static: true })
  public listHost!: ListHostDirective;

  private componentRef!: ComponentRef<ListComponent<unknown>>;

  constructor(_componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private cdr: ChangeDetectorRef
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
    this.cdr.markForCheck();
  }

  private makeCustomConfigInjector(listConfig: IListConfig<T>) {
    return Injector.create({
      providers: [{ provide: ListConfig, useValue: listConfig }],
      parent: this.injector
    });
  }
}
