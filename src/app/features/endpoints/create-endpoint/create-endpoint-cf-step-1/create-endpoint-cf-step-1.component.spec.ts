import { SharedModule } from '../../../../shared/shared.module';
import { CoreModule } from '../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1.component';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../store/reducers.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CreateEndpointCfStep1Component', () => {
  let component: CreateEndpointCfStep1Component;
  let fixture: ComponentFixture<CreateEndpointCfStep1Component>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateEndpointCfStep1Component],
      imports: [
        CoreModule,
        SharedModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          }),
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointCfStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
