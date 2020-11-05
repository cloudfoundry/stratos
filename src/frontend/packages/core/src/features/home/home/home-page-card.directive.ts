import {
  Compiler,
  ComponentRef,
  Directive,
  EventEmitter,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewContainerRef,
} from '@angular/core';
import { of, Subscription } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { EndpointModel, entityCatalog } from '../../../../../store/src/public-api';
import { HomePageCardLayout, HomePageEndpointCard } from './../home.types';

@Directive({
  selector: '[appHomeCard]',
})
export class HomePageCardDirective implements OnInit, OnDestroy {

  private canLoad = false;

  private _layout: HomePageCardLayout;

  @Input() appHomeCard: EndpointModel;

  @Input() set layout(value: HomePageCardLayout) {
    this._layout = value;
    if (this.ref) {
      this.ref.instance.layout = value;
    }
  };

  @Input() set load(value: boolean) {
    this.canLoad = value;
    this.loadCard();
  }

  @Output() loaded = new EventEmitter<boolean>();

  private ref: ComponentRef<HomePageEndpointCard>;

  private sub: Subscription;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private compiler: Compiler,
    private injector: Injector,
  ) { }

  ngOnInit() {
    // Dynamically load the component for the Home Card
    const endpointEntity = entityCatalog.getEndpoint(this.appHomeCard.cnsi_type, this.appHomeCard.sub_type)
    if (endpointEntity.definition.homeCard && endpointEntity.definition.homeCard.component) {
      this.createCard(endpointEntity);
    } else {
      console.warn(`'No endpoint home card for ${this.appHomeCard.guid}`);
    }
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.destroy();
    }
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  // Ask the card to load itself
  loadCard() {
    if (this.canLoad && this.ref && this.ref.instance && this.ref.instance.load) {
      const loadObs = this.ref.instance.load() || of(true);
      this.sub = loadObs.pipe(filter(v => v === true), first()).subscribe(() => this.loaded.next(null));
    }
  }

  async createCard(endpointEntity: any) {
    this.viewContainerRef.clear();
    const component = await endpointEntity.definition.homeCard.component(this.compiler, this.injector);
    this.ref = this.viewContainerRef.createComponent(component);
    (this.ref.instance as any).endpoint = this.appHomeCard;
    (this.ref.instance as any).layout = this._layout;
    this.loadCard();
  }

}
