
import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnChanges,
  OnInit,
  SimpleChange,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
} from '@angular/core';

import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';

import { CardCell } from '../../list.types';
import { CardAppComponent } from '../../list-types/app/card/card-app.component';
import { EndpointCardComponent } from '../../list-types/cf-endpoints/cf-endpoint-card/endpoint-card.component';
import { CfOrgCardComponent } from '../../list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfSpaceCardComponent } from '../../list-types/cf-spaces/cf-space-card/cf-space-card.component';
import { CfBuildpackCardComponent } from '../../list-types/cf-buildpacks/cf-buildpack-card/cf-buildpack-card.component';
import {
  CfSecurityGroupsCardComponent
} from '../../list-types/cf-security-groups/cf-security-groups-card/cf-security-groups-card.component';
import { CfStacksCardComponent } from '../../list-types/cf-stacks/cf-stacks-card/cf-stacks-card.component';
import { CfServiceCardComponent } from '../../list-types/cf-services/cf-service-card/cf-service-card.component';
import {
  AppServiceBindingCardComponent
} from '../../list-types/app-sevice-bindings/app-service-binding-card/app-service-binding-card.component';
import { ServiceInstanceCardComponent } from '../../list-types/services-wall/service-instance-card/service-instance-card.component';
import { CardMultiActionComponents } from './card.component.types';
import { MultiActionListEntity } from '../../../../monitors/pagination-monitor';

export const listCards = [
  CardAppComponent,
  EndpointCardComponent,
  CfOrgCardComponent,
  CfSpaceCardComponent,
  CfBuildpackCardComponent,
  CfSecurityGroupsCardComponent,
  CfStacksCardComponent,
  CfServiceCardComponent,
  AppServiceBindingCardComponent,
  ServiceInstanceCardComponent
];
type cardTypes<T> = Type<CardCell<T>> | CardMultiActionComponents;
@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  entryComponents: [
    ...listCards
  ]
})
export class CardComponent<T> {
  private componentRef: ComponentRef<any>;
  private _component: cardTypes<T>;
  private _item: T | MultiActionListEntity;

  @Input() set component(component: cardTypes<T>) {
    if (!this._component) {
      this.setupComponent(component, this.item);
      this._component = component;
    }
  }
  get component() {
    return this._component;
  }

  @Input() set item(item: T | MultiActionListEntity) {
    this._item = item;
    this.setupComponent(this.component, item);
  }

  get item() {
    return this._item;
  }

  @Input() dataSource = null as IListDataSource<T>;

  @ViewChild('target', { read: ViewContainerRef }) target: ViewContainerRef;

  cardComponent: CardCell<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  private setupComponent(componentType: cardTypes<T>, item: T | MultiActionListEntity) {
    if (!componentType || !item) {
      return;
    }
    const { component, schemaKey, entity } = this.getComponent(componentType, item);
    if (component) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
      if (componentFactory) {
        // Add to target to ensure ngcontent is correct in new component
        // if (componentRef !== this.componentRef) {
        this.clear();
        this.componentRef = this.target.createComponent(componentFactory);
        this.cardComponent = this.componentRef.instance as CardCell<T>;
        // }
        this.cardComponent.row = entity;
        this.cardComponent.dataSource = this.dataSource;
        this.cardComponent.schemaKey = schemaKey;
      }
    }
  }

  private clear() {
    if (this.target) {
      this.target.clear();
    }
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  public getComponent(component: any | CardMultiActionComponents, item: T | MultiActionListEntity) {
    const { schemaKey, entity } = item as MultiActionListEntity;
    if (component instanceof CardMultiActionComponents && schemaKey) {
      return {
        component: component.getComponent(schemaKey),
        schemaKey,
        entity
      }
    }
    return {
      component,
      entity: item
    };
  }
}
