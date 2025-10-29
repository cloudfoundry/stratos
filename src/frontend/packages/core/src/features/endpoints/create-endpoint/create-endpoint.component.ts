import { CommonModule } from '@angular/common';
import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { entityCatalog } from '@stratosui/store';

import { getIdFromRoute } from '../../../core/utils.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StepComponent } from '../../../shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';
import { CreateEndpointConnectComponent } from './create-endpoint-connect/create-endpoint-connect.component';

@Component({
  selector: 'app-create-endpoint',
  templateUrl: './create-endpoint.component.html',
  styleUrls: ['./create-endpoint.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateEndpointCfStep1Component,
    CreateEndpointConnectComponent,
  ]
})
export class CreateEndpointComponent implements OnInit, OnDestroy {

  showConnectStep: boolean;

  component: any;
  @ViewChild('customComponent', { read: ViewContainerRef, static: true }) customComponentContainer: ViewContainerRef;
  componentRef: ComponentRef<any>;

  constructor(
    activatedRoute: ActivatedRoute,
    private resolver: ComponentFactoryResolver,
  ) {
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
