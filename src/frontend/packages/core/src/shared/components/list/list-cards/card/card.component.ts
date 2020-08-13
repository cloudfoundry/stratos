import { Component, ComponentFactoryResolver, ComponentRef, Input, Type, ViewChild, ViewContainerRef } from '@angular/core';

import { MultiActionListEntity } from '../../../../../../../store/src/monitors/pagination-monitor';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import { EndpointCardComponent } from '../../list-types/endpoint/endpoint-card/endpoint-card.component';
import { CardCell } from '../../list.types';
import { CardDynamicComponent, CardMultiActionComponents } from '../card.component.types';

export const listCards = [
  EndpointCardComponent
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

  @ViewChild('target', { read: ViewContainerRef, static: true }) target: ViewContainerRef;

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
    if (!this.cardComponent && component) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
      if (componentFactory) {
        this.clear();
        this.componentRef = this.target.createComponent(componentFactory);
        this.cardComponent = this.componentRef.instance as CardCell<T>;
      }
    }
    this.updateComponentInputs(dataSource, entityKey, entity);
  }

  private updateComponentInputs(dataSource, entityKey, entity) {
    if (this.cardComponent) {
      this.cardComponent.row = entity;
      this.cardComponent.dataSource = dataSource;
      this.cardComponent.entityKey = entityKey;
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
