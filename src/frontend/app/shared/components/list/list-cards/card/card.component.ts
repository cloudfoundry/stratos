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
} from '@angular/core';

import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';
import {
  AppServiceBindingCardComponent,
} from '../../list-types/app-sevice-bindings/app-service-binding-card/app-service-binding-card.component';
import { CardAppComponent } from '../../list-types/app/card/card-app.component';
import { CfBuildpackCardComponent } from '../../list-types/cf-buildpacks/cf-buildpack-card/cf-buildpack-card.component';
import { EndpointCardComponent } from '../../list-types/cf-endpoints/cf-endpoint-card/endpoint-card.component';
import { CfOrgCardComponent } from '../../list-types/cf-orgs/cf-org-card/cf-org-card.component';
import {
  CfSecurityGroupsCardComponent,
} from '../../list-types/cf-security-groups/cf-security-groups-card/cf-security-groups-card.component';
import { CfServiceCardComponent } from '../../list-types/cf-services/cf-service-card/cf-service-card.component';
import { CfSpaceCardComponent } from '../../list-types/cf-spaces/cf-space-card/cf-space-card.component';
import { CfStacksCardComponent } from '../../list-types/cf-stacks/cf-stacks-card/cf-stacks-card.component';
import {
  ServiceInstanceCardComponent,
} from '../../list-types/services-wall/service-instance-card/service-instance-card.component';
import { CardCell } from '../../list.types';

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

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  entryComponents: [
    ...listCards,
  ]
})
export class CardComponent<T> implements OnInit, OnChanges {

  @Input() component: Type<{}>;
  @Input() item: T;
  @Input() dataSource = null as IListDataSource<T>;

  @ViewChild('target', { read: ViewContainerRef }) target;

  cardComponent: CardCell<T>;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    if (!this.component) {
      return;
    }
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);
    // Add to target to ensure ngcontent is correct in new component
    const componentRef = this.target.createComponent(componentFactory);
    this.cardComponent = <CardCell<T>>componentRef.instance;
    this.cardComponent.row = this.item;
    this.cardComponent.dataSource = this.dataSource;
  }

  ngOnChanges(changes: SimpleChanges) {
    const row: SimpleChange = changes.item;
    if (
      row &&
      this.cardComponent &&
      row.previousValue !== row.currentValue
    ) {
      this.cardComponent.row = row.currentValue;
    }
  }

}
