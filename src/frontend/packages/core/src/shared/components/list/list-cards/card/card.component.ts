import { Component, ComponentFactoryResolver, ComponentRef, Input, Type, ViewChild, ViewContainerRef } from '@angular/core';

import { MultiActionListEntity } from '../../../../monitors/pagination-monitor';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import {
  AppServiceBindingCardComponent,
} from '../../list-types/app-sevice-bindings/app-service-binding-card/app-service-binding-card.component';
import { CardAppComponent } from '../../list-types/app/card/card-app.component';
import { CfBuildpackCardComponent } from '../../list-types/cf-buildpacks/cf-buildpack-card/cf-buildpack-card.component';
import { CfOrgCardComponent } from '../../list-types/cf-orgs/cf-org-card/cf-org-card.component';
import {
  CfSecurityGroupsCardComponent,
} from '../../list-types/cf-security-groups/cf-security-groups-card/cf-security-groups-card.component';
import { CfServiceCardComponent } from '../../list-types/cf-services/cf-service-card/cf-service-card.component';
import { CfSpaceCardComponent } from '../../list-types/cf-spaces/cf-space-card/cf-space-card.component';
import { CfStacksCardComponent } from '../../list-types/cf-stacks/cf-stacks-card/cf-stacks-card.component';
import {
  UserProvidedServiceInstanceCardComponent,
} from '../../list-types/services-wall/user-provided-service-instance-card/user-provided-service-instance-card.component';
import { CardMultiActionComponents } from '../card.component.types';

import { EndpointCardComponent } from '../../list-types/endpoint/endpoint-card/endpoint-card.component';
import {
  ServiceInstanceCardComponent,
} from '../../list-types/services-wall/service-instance-card/service-instance-card.component';
import { CardCell } from '../../list.types';

export const listCards = [
  CardAppComponent,
  CfOrgCardComponent,
  CfSpaceCardComponent,
  CfBuildpackCardComponent,
  CfSecurityGroupsCardComponent,
  CfStacksCardComponent,
  CfServiceCardComponent,
  AppServiceBindingCardComponent,
  ServiceInstanceCardComponent,
  UserProvidedServiceInstanceCardComponent,
  EndpointCardComponent
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
  private pComponent: cardTypes<T>;
  private pItem: T | MultiActionListEntity;

  @Input() set component(component: cardTypes<T>) {
    if (!this.pComponent) {
      this.setupComponent(component, this.item);
      this.pComponent = component;
    }
  }
  get component() {
    return this.pComponent;
  }

  @Input() set item(item: T | MultiActionListEntity) {
    this.pItem = item;
    this.setupComponent(this.component, item);
  }

  get item() {
    return this.pItem;
  }

  @Input() dataSource = null as IListDataSource<T>;

  @ViewChild('target', { read: ViewContainerRef }) target: ViewContainerRef;

  cardComponent: CardCell<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  private setupComponent(componentType: cardTypes<T>, item: T | MultiActionListEntity) {
    if (!componentType || !item) {
      return;
    }
    const { component, entityKey, entity } = this.getComponent(componentType, item);
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
        this.cardComponent.entityKey = entityKey;
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

  private getComponent(component: any | CardMultiActionComponents, item: T | MultiActionListEntity) {
    const { entityKey, entity } = this.getEntity(item);
    if (component instanceof CardMultiActionComponents && entityKey) {
      return {
        component: component.getComponent(entityKey),
        entityKey,
        entity
      };
    }
    return {
      component,
      entity
    };
  }

  private getEntity(item: T | MultiActionListEntity) {
    if (item instanceof MultiActionListEntity) {
      return {
        entityKey: item.entityKey,
        entity: item.entity
      };
    }
    return {
      entity: item
    };
  }
}
