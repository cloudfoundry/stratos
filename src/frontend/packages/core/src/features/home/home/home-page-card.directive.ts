import { Compiler, ComponentRef, Directive, Injector, Input, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';

import { EndpointModel, entityCatalog } from '../../../../../store/src/public-api';
import { HomePageCardLayout, HomePageEndpointCard } from './../home.types';

@Directive({
  selector: '[appHomeCard]',
})
export class HomePageCardDirective implements OnInit, OnDestroy {

  private _layout: HomePageCardLayout;

  @Input() appHomeCard: EndpointModel;

  @Input() set layout(value: HomePageCardLayout) {
    this._layout = value;
    if (this.ref) {
      this.ref.instance.layout = value;
    }
  };

  private ref: ComponentRef<HomePageEndpointCard>;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private compiler: Compiler,
    private injector: Injector,
  ) { }

  ngOnInit() {
    // Dynamically load the component
    const endpointEntity = entityCatalog.getEndpoint(this.appHomeCard.cnsi_type, this.appHomeCard.sub_type)
    if (endpointEntity.definition.homeCard && endpointEntity.definition.homeCard.component) {
      this.load(endpointEntity);
    } else {
      console.warn(`'No endpoint home card for ${this.appHomeCard.guid}`);
    }
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.destroy();
    }
  }

  async load(endpointEntity: any) {
    this.viewContainerRef.clear();
    const component = await endpointEntity.definition.homeCard.component(this.compiler, this.injector);
    this.ref = this.viewContainerRef.createComponent(component);
    (this.ref.instance as any).endpoint = this.appHomeCard;
    (this.ref.instance as any).layout = this._layout;
  }

}
