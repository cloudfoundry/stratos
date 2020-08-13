import { Component, ViewChild, ViewContainerRef, ComponentRef, OnInit, OnDestroy, ComponentFactory, ComponentFactoryResolver } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog';
import { getIdFromRoute } from '../../../core/utils.service';


@Component({
  selector: 'app-create-endpoint',
  templateUrl: './create-endpoint.component.html',
  styleUrls: ['./create-endpoint.component.scss']
})
export class CreateEndpointComponent implements OnInit, OnDestroy {

  showConnectStep: boolean;

  component: any;
  @ViewChild('customComponent', { read: ViewContainerRef, static: true }) customComponentContainer;
  componentRef: ComponentRef<any>;

  constructor(activatedRoute: ActivatedRoute, private resolver: ComponentFactoryResolver) {
    const epType = getIdFromRoute(activatedRoute, 'type');
    const epSubType = getIdFromRoute(activatedRoute, 'subtype');
    const endpoint = entityCatalog.getEndpoint(epType, epSubType);

    this.component = endpoint.definition.registrationComponent;
    this.showConnectStep = !endpoint.definition.unConnectable ?
      endpoint.definition.authTypes && !!endpoint.definition.authTypes.length :
      false;
  }

  ngOnInit() {
    this.customComponentContainer.clear();
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    if (this.component) {
      const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(this.component);
      this.componentRef = this.customComponentContainer.createComponent(factory);
    }
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

}
