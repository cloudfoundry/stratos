import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { cloudFoundryEndpointTypes } from '../../../../../cloud-foundry/src/cloud-foundry.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../core/core.module';
import { initEndpointTypes } from '../../../features/endpoints/endpoint-helpers';
import { SharedModule } from '../../shared.module';
import { EndpointsMissingComponent } from './endpoints-missing.component';

describe('EndpointsMissingComponent', () => {
  let component: EndpointsMissingComponent;
  let fixture: ComponentFixture<EndpointsMissingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        RouterTestingModule
      ]
    })
      .compileComponents();
    initEndpointTypes(cloudFoundryEndpointTypes);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointsMissingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
