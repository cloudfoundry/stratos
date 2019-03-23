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
import { EndpointCardComponent } from '../../list-types/endpoint/endpoint-card/endpoint-card.component';
import {
  ServiceInstanceCardComponent,
} from '../../list-types/services-wall/service-instance-card/service-instance-card.component';
import {
  UserProvidedServiceInstanceCardComponent,
} from '../../list-types/services-wall/user-provided-service-instance-card/user-provided-service-instance-card.component';
import { CardCell } from '../../list.types';
import { CardDynamicComponent, CardMultiActionComponents } from '../card.component.types';
import {
  AppAutoscalerMetricChartCardComponent
} from '../../list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/app-autoscaler-metric-chart-card.component';
import {
  AppAutoscalerComboChartComponent
} from '../../list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/combo-chart/combo-chart.component';
import {
  AppAutoscalerComboSeriesVerticalComponent
} from '../../list-types/app-autoscaler-metric-chart/app-autoscaler-metric-chart-card/combo-chart/combo-series-vertical.component';


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
  EndpointCardComponent,
  AppAutoscalerMetricChartCardComponent,
  AppAutoscalerComboChartComponent,
  AppAutoscalerComboSeriesVerticalComponent
];
export type CardTypes<T> = Type<CardCell<T>> | CardMultiActionComponents | CardDynamicComponent<T>;

interface ISetupData<T> {
  dataSource: IListDataSource<T>;
  componentType: CardTypes<T>;
  item: T | MultiActionListEntity;
}
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
  private pComponent: CardTypes<T>;
  private pDataSource: IListDataSource<T>;

  @Input() set dataSource(dataSource: IListDataSource<T>) {
    if (!this.pDataSource) {
      this.componentCreator({ dataSource });
      this.pDataSource = dataSource;
    }
  }

  @Input() set component(componentType: CardTypes<T>) {
    if (!this.pComponent) {
      this.componentCreator({ componentType });
      this.pComponent = componentType;
    }
  }

  @Input() set item(item: T | MultiActionListEntity) {
    this.componentCreator({ item });
  }

  @ViewChild('target', { read: ViewContainerRef }) target: ViewContainerRef;

  cardComponent: CardCell<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  private componentCreator = (() => {
    let completeSetupData: Partial<ISetupData<T>> = {};
    return (setupData: Partial<ISetupData<T>>, ) => {
      completeSetupData = {
        ...completeSetupData,
        ...setupData
      };
      if (completeSetupData.componentType && completeSetupData.dataSource && completeSetupData.item) {
        this.setupComponent(completeSetupData.componentType, completeSetupData.item, completeSetupData.dataSource);
      }
    };
  })();

  private setupComponent(componentType: CardTypes<T>, item: T | MultiActionListEntity, dataSource: IListDataSource<T>) {
    if (!componentType || !item) {
      return;
    }
    const { component, entityKey, entity } = this.getComponent(componentType, item);
    if (component) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
      if (componentFactory) {
        this.clear();
        this.componentRef = this.target.createComponent(componentFactory);
        this.cardComponent = this.componentRef.instance as CardCell<T>;
        this.cardComponent.row = entity;
        this.cardComponent.dataSource = dataSource;
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

  private getComponent(component: CardTypes<T>, item: T | MultiActionListEntity): {
    component: Type<CardCell<T>>,
    entity: T,
    entityKey?: string;
  } {
    const { entityKey, entity } = this.getEntity(item);
    if (component instanceof CardMultiActionComponents) {
      return {
        component: entityKey ? component.getComponent(entityKey) : null,
        entityKey,
        entity
      };
    } else if (component instanceof CardDynamicComponent) {
      return {
        component: component.getComponent(entity),
        entity
      };
    }
    return {
      component: (component as Type<CardCell<T>>),
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
