import { RouterTestingModule } from '@angular/router/testing';
import { EndpointsModule } from '../endpoints.module';
import { SharedModule } from '../../../shared/shared.module';
import { CoreModule } from '../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEndpointComponent } from './create-endpoint.component';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';
import { CreateEndpointCfStep2Component } from './create-endpoint-cf-step-2/create-endpoint-cf-step-2.component';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CreateEndpointComponent', () => {
  let component: CreateEndpointComponent;
  let fixture: ComponentFixture<CreateEndpointComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateEndpointComponent,
        CreateEndpointCfStep1Component,
        CreateEndpointCfStep2Component,
      ],
      imports: [
        CoreModule,
        SharedModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          }),
        RouterTestingModule,
        NoopAnimationsModule

      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
